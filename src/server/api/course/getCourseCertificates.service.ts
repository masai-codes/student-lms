import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { resolveCertificateS3Config } from '@/secrets'
import { asHttpUrl } from '@/lib/certificates/certificateShare'

export interface CertificateItem {
  certificateObjectId: string
  code: string | null
  pdfUrl: string | null
  verificationUrl: string | null
  certificateTitle: string | null
  certificateType: string | null
  issuedDateIso: string | null
  batchName: string
}

type RawRow = Record<string, unknown>

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as Record<string, unknown>)['rows'])
  ) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

function parseJson(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try {
    return JSON.parse(String(raw)) as Record<string, unknown>
  } catch {
    return {}
  }
}

const SIGNED_URL_EXPIRY_SECONDS = 60 * 15

const normalizeS3Key = (key: string) =>
  key
    .trim()
    .replace(/^s3:\/\/[^/]+\//, '')
    .replace(/^\/+/, '')

const parseS3Bucket = (uri: string): string => {
  const m = uri.match(/^s3:\/\/([^/]+)/)
  if (!m?.[1]) throw new Error('Invalid certificate S3 URI')
  return m[1]
}

async function generateSignedUrl(objectKey: string): Promise<string | null> {
  if (!objectKey) return null
  try {
    const [
      { GetBucketLocationCommand, GetObjectCommand, S3Client },
      { getSignedUrl },
    ] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ])
    const s3Config = resolveCertificateS3Config()
    const bucket = parseS3Bucket(s3Config.certificateTemplatesS3Uri)
    const key = normalizeS3Key(objectKey)

    const baseClient = new S3Client({
      region: s3Config.region,
      credentials: s3Config.credentials,
    })
    const locationRes = await baseClient.send(
      new GetBucketLocationCommand({ Bucket: bucket }),
    )
    const bucketRegion =
      locationRes.LocationConstraint === 'EU'
        ? 'eu-west-1'
        : (locationRes.LocationConstraint ?? 'us-east-1')

    const s3Client =
      bucketRegion === s3Config.region
        ? baseClient
        : new S3Client({
            region: bucketRegion,
            credentials: s3Config.credentials,
          })

    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      {
        expiresIn: SIGNED_URL_EXPIRY_SECONDS,
      },
    )
  } catch (err) {
    console.error(
      'Failed to generate signed URL for certificate',
      objectKey,
      err,
    )
    return null
  }
}

/**
 * @param batchId a batch to scope to, or `null` for every batch the user holds a
 *   certificate in (the profile tab, which is not batch-scoped).
 */
export async function getCourseCertificates(
  batchId: number | null,
  userId: number,
): Promise<CertificateItem[]> {
  // Composed rather than interpolated as `(? IS NULL OR …)` so the unscoped
  // query stays index-friendly on `certificate_user_relation(user_id)`.
  const relationBatchFilter =
    batchId == null ? sql`` : sql`AND cur.batch_id = ${batchId}`
  const legacyBatchFilter =
    batchId == null ? sql`` : sql`AND batch_id = ${batchId}`

  const [newRows, legacyRows] = await Promise.all([
    normalizeRows(
      await db.execute(sql`
      SELECT
        cbs.certificate_object_id,
        cbs.meta                     AS cbsMeta,
        ctb.meta                     AS ctbMeta,
        ctb.batch_name               AS templateBatchName,
        b.name                       AS batchName
      FROM certificate_user_relation cur
      JOIN certificates_batch_students cbs ON cbs.id = cur.certificate_id
      JOIN certificates_template_batch ctb ON ctb.id = cbs.batch_id
      LEFT JOIN batches b ON b.id = cur.batch_id
      WHERE cur.user_id  = ${userId}
        ${relationBatchFilter}
        AND cur.deleted_at IS NULL
      ORDER BY cur.created_at DESC
    `),
    ),
    normalizeRows(
      await db.execute(sql`
      SELECT id, certificate_type, certificate_code, certificate_url, share_text, created_at
      FROM user_certificates
      WHERE user_id  = ${userId}
        ${legacyBatchFilter}
      ORDER BY created_at DESC
    `),
    ),
  ])

  const visible = newRows.filter((row) => {
    const ctbMeta = parseJson(row.ctbMeta)
    return (
      ctbMeta['visibleToStudents'] === true ||
      ctbMeta['visibleToStudents'] === 'true'
    )
  })

  const newCerts = await Promise.all(
    visible.map(async (row): Promise<CertificateItem> => {
      const cbsMeta = parseJson(row.cbsMeta)
      const ctbMeta = parseJson(row.ctbMeta)
      const verificationConfig = (ctbMeta['verificationConfiguration'] ??
        {}) as Record<string, unknown>
      const objectKey = row.certificate_object_id
        ? String(row.certificate_object_id)
        : ''
      const pdfUrl = await generateSignedUrl(objectKey)
      return {
        certificateObjectId: objectKey,
        code: null,
        pdfUrl,
        // The admin tool stores the public verification link on the student row
        // when it issues the certificate; that is the authoritative value and the
        // only one the old LMS reads. Building it from CERTIFICATE_VERIFY_BASE_URL
        // is a fallback for rows issued before that field existed — and it yields
        // null wherever that env var is unset, which is why every certificate
        // looked unshareable/unviewable before this.
        verificationUrl: (() => {
          const stored = asHttpUrl(
            cbsMeta['verificationUrl']
              ? String(cbsMeta['verificationUrl'])
              : null,
          )
          if (stored) return stored

          const certId = cbsMeta['certificateId']
            ? String(cbsMeta['certificateId'])
            : null
          if (!certId) return null
          const base = (process.env.CERTIFICATE_VERIFY_BASE_URL ?? '').replace(
            /\/$/,
            '',
          )
          return base ? asHttpUrl(`${base}/${certId}`) : null
        })(),
        certificateTitle: ctbMeta['certificateTitle']
          ? String(ctbMeta['certificateTitle'])
          : null,
        certificateType: ctbMeta['certificateType']
          ? String(ctbMeta['certificateType'])
          : null,
        issuedDateIso: verificationConfig['issuedDateIso']
          ? String(verificationConfig['issuedDateIso'])
          : null,
        // The enrolment batch ("IITRPRAI-2409"), matching the old LMS. The
        // template's own `batch_name` is an internal label ("test2") and is only
        // a fallback.
        batchName: String(row.batchName ?? row.templateBatchName ?? ''),
      }
    }),
  )

  const legacyCerts: CertificateItem[] = legacyRows.map(
    (row): CertificateItem => ({
      certificateObjectId: `legacy-${String(row.id)}`,
      code: row.certificate_code ? String(row.certificate_code) : null,
      // `user_certificates.certificate_url` is a public verification page
      // (verify.masaischool.com/certificate/<code>), not a file, so it belongs in
      // verificationUrl. It was previously mapped to pdfUrl while
      // verificationUrl was taken from `share_text` — LinkedIn caption copy —
      // which the view modal then tried to load as an iframe src.
      pdfUrl: null,
      verificationUrl: asHttpUrl(
        row.certificate_url ? String(row.certificate_url) : null,
      ),
      certificateTitle: row.certificate_type
        ? String(row.certificate_type)
        : null,
      certificateType: row.certificate_type
        ? String(row.certificate_type)
        : null,
      issuedDateIso: row.created_at ? String(row.created_at) : null,
      batchName: '',
    }),
  )

  return [...newCerts, ...legacyCerts]
}
