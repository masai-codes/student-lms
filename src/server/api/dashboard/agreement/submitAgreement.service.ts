import { and, eq, isNull, sql } from 'drizzle-orm'
import {
  AGREEMENT_LOGO_URL,
  buildAgreementSteps,
  buildReferenceNumber,
  istNow,
  sectionAgreementKey,
} from './agreementShared'
import { buildAgreementPdf } from './buildAgreementPdf'
import type { AgreementPdfDoc } from './buildAgreementPdf'
import { db } from '@/db'
import { batches, profiles, sectionUser, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { uploadImageToS3 } from '@/server/storage/s3Upload'

export interface SubmitAgreementResult {
  agreementPdfUrl: string
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result))
    return (Array.isArray(result[0]) ? result[0] : result) as Array<T>
  if (result && typeof result === 'object' && 'rows' in result)
    return (result as { rows: Array<T> }).rows
  return []
}

async function fetchBytes(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url)
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

/**
 * Finalises a section's agreement: verifies enrollment, generates the signed
 * merged PDF (agreement docs + a certificate page), uploads it to S3, and marks
 * every step accepted (`haveAcceptedLegalAgreement`) in
 * `profiles.legal_data.agreements.section_<id>`. `ipAddress` is recorded on the
 * certificate for the legal record.
 */
export async function submitAgreement(
  userId: number,
  sectionId: number,
  ipAddress: string,
): Promise<SubmitAgreementResult> {
  const [enrolled] = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sectionUser.sectionId, sectionId),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)
  if (!enrolled) throw new ApiError(403, 'NOT_ENROLLED_IN_SECTION')

  const [sectionRow] = normalizeRows<{
    name: string
    batch_id: number
    agreements: string | null
  }>(
    await db.execute(sql`
      SELECT name, batch_id, settings->>'$.agreements' AS agreements
      FROM sections WHERE id = ${sectionId} LIMIT 1
    `),
  )
  const steps = sectionRow
    ? buildAgreementSteps(asRecord(safeJson(sectionRow.agreements)))
    : []
  if (!steps.length) throw new ApiError(400, 'NO_AGREEMENT_FOR_SECTION')

  const [[batch], [user], [profile]] = await Promise.all([
    db
      .select({ name: batches.name, program: batches.program })
      .from(batches)
      .where(eq(batches.id, sectionRow.batch_id))
      .limit(1),
    db
      .select({
        name: users.name,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ id: profiles.id, legalData: profiles.legalData })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
      .limit(1),
  ])
  if (!profile) throw new ApiError(400, 'PROFILE_NOT_FOUND')

  const key = sectionAgreementKey(sectionId)
  const legalData = asRecord(profile.legalData)
  const agreements = asRecord(legalData['agreements'])
  const existing = asRecord(agreements[key])
  const nowIso = istNow().toISOString()
  const referenceNumber =
    (existing['referenceNumber'] as string | undefined) ??
    buildReferenceNumber(userId, sectionId)

  const docs = (
    await Promise.all(
      steps.map(async (s): Promise<AgreementPdfDoc | null> => {
        const bytes = await fetchBytes(s.pdfUrl)
        return bytes ? { heading: s.heading, bytes } : null
      }),
    )
  ).filter((d): d is AgreementPdfDoc => d !== null)

  const pdfBytes = await buildAgreementPdf(
    docs,
    {
      referenceNumber,
      name: (existing['name'] as string | undefined) ?? user?.name ?? '',
      email: user?.email ?? '',
      studentCode: user?.username ?? '',
      panNumber: existing['panNumber'] as string | undefined,
      passportNumber: existing['passportNumber'] as string | undefined,
      address: (existing['address'] as string | undefined) ?? '',
      program: batch?.program ?? '',
      sectionName: sectionRow.name ?? '',
      viewed:
        (existing['viewTime'] as string | undefined) ??
        (existing['formDetailCreateTime'] as string | undefined) ??
        nowIso,
      signed: nowIso,
      ipAddress,
      location: (existing['location'] as string | undefined) ?? '',
    },
    await fetchBytes(AGREEMENT_LOGO_URL),
  )

  const agreementPdfUrl = await uploadImageToS3({
    buffer: Buffer.from(pdfBytes),
    contentType: 'application/pdf',
    ext: 'pdf',
    keyPrefix: `legal-agreement/${userId}/${sectionId}`,
  })

  const merged = {
    ...existing,
    referenceNumber,
    ipAddress,
    viewTime: existing['viewTime'] ?? nowIso,
    acceptedSteps: Object.fromEntries(steps.map((s) => [s.key, true])),
    haveAcceptedLegalAgreement: true,
    finalSignTime: nowIso,
    agreementPdfUrl,
    pdfGeneratedTime: nowIso,
  }
  await db
    .update(profiles)
    .set({
      legalData: { ...legalData, agreements: { ...agreements, [key]: merged } },
    })
    .where(eq(profiles.id, profile.id))

  return { agreementPdfUrl }
}

function safeJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}
