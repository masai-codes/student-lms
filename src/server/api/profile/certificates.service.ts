import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { resolveCertificateS3Config } from '@/secrets'

export interface CertificateItem {
  certificateObjectId: string
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
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

function parseJson(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

const SIGNED_URL_EXPIRY_SECONDS = 60 * 15

const normalizeS3Key = (key: string) =>
  key.trim().replace(/^s3:\/\/[^/]+\//, '').replace(/^\/+/, '')

const parseS3Bucket = (uri: string): string => {
  const m = uri.match(/^s3:\/\/([^/]+)/)
  if (!m?.[1]) throw new Error('Invalid certificate S3 URI')
  return m[1]
}

async function generateSignedUrl(objectKey: string): Promise<string | null> {
  if (!objectKey) return null
  try {
    const [{ GetBucketLocationCommand, GetObjectCommand, S3Client }, { getSignedUrl }] =
      await Promise.all([import('@aws-sdk/client-s3'), import('@aws-sdk/s3-request-presigner')])
    const s3Config = resolveCertificateS3Config()
    const bucket = parseS3Bucket(s3Config.certificateTemplatesS3Uri)
    const key = normalizeS3Key(objectKey)

    const baseClient = new S3Client({ region: s3Config.region, credentials: s3Config.credentials })
    const locationRes = await baseClient.send(new GetBucketLocationCommand({ Bucket: bucket }))
    const bucketRegion = locationRes.LocationConstraint === 'EU'
      ? 'eu-west-1'
      : (locationRes.LocationConstraint ?? 'us-east-1')

    const s3Client = bucketRegion === s3Config.region
      ? baseClient
      : new S3Client({ region: bucketRegion, credentials: s3Config.credentials })

    return await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: SIGNED_URL_EXPIRY_SECONDS,
    })
  } catch (err) {
    console.error('Failed to generate signed URL for certificate', objectKey, err)
    return null
  }
}

export async function getCertificates(userId: number): Promise<Array<CertificateItem>> {
  const rows = normalizeRows(
    await db.execute(sql`
      SELECT
        cur.user_id,
        cbs.certificate_object_id,
        cbs.meta                     AS cbsMeta,
        ctb.meta                     AS ctbMeta,
        ctb.batch_name               AS batchName
      FROM certificate_user_relation cur
      JOIN certificates_batch_students cbs ON cbs.id = cur.certificate_id
      JOIN certificates_template_batch ctb ON ctb.id = cbs.batch_id
      WHERE cur.user_id = ${userId}
        AND cur.deleted_at IS NULL
      ORDER BY cur.created_at DESC
    `)
  )

  // Filter to only visibleToStudents = true
  const visible = rows.filter((row) => {
    const ctbMeta = parseJson(row.ctbMeta)
    return ctbMeta['visibleToStudents'] === true || ctbMeta['visibleToStudents'] === 'true'
  })

  // Generate signed URLs in parallel
  const results = await Promise.all(
    visible.map(async (row): Promise<CertificateItem> => {
      const cbsMeta = parseJson(row.cbsMeta)
      const ctbMeta = parseJson(row.ctbMeta)
      const verificationConfig = (ctbMeta['verificationConfiguration'] ?? {}) as Record<string, unknown>
      const objectKey = row.certificate_object_id ? String(row.certificate_object_id) : ''
      const pdfUrl = await generateSignedUrl(objectKey)

      return {
        certificateObjectId: objectKey,
        pdfUrl,
        verificationUrl: (() => {
          const certId = cbsMeta['certificateId'] ? String(cbsMeta['certificateId']) : null
          if (!certId) return null
          const base = (process.env.CERTIFICATE_VERIFY_BASE_URL ?? '').replace(/\/$/, '')
          return base ? `${base}/${certId}` : null
        })(),
        certificateTitle: ctbMeta['certificateTitle'] ? String(ctbMeta['certificateTitle']) : null,
        certificateType: ctbMeta['certificateType'] ? String(ctbMeta['certificateType']) : null,
        issuedDateIso: verificationConfig['issuedDateIso'] ? String(verificationConfig['issuedDateIso']) : null,
        batchName: String(row.batchName ?? ''),
      }
    })
  )

  return results
}
