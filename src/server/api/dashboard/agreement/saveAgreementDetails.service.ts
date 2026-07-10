import { and, eq, isNull } from 'drizzle-orm'
import {
  buildReferenceNumber,
  istNow,
  pickAgreementFormValues,
  sectionAgreementKey,
} from './agreementShared'
import type { AgreementFormValues } from './agreementShared'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export interface SaveAgreementResult {
  savedValues: AgreementFormValues
  referenceNumber: string
  /** Client IP recorded for the certificate (matches the reference flow, which stamps it on save). */
  ipAddress: string | null
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

/**
 * Autosaves the agreement detail form for a section into
 * `profiles.legal_data.agreements.section_<id>` (upserting the profile row).
 * Idempotent — merges over any existing values and stamps create/update times.
 * Does NOT mark the agreement accepted; that happens on submit.
 */
export async function saveAgreementDetails(
  userId: number,
  sectionId: number,
  values: AgreementFormValues,
  ipAddress?: string,
): Promise<SaveAgreementResult> {
  const cleanValues = pickAgreementFormValues(values)
  const key = sectionAgreementKey(sectionId)
  const now = istNow().toISOString()

  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const legalData = asRecord(profile?.legalData)
  const agreements = asRecord(legalData['agreements'])
  const existing = asRecord(agreements[key])
  const referenceNumber = (existing['referenceNumber'] as string | undefined) ?? buildReferenceNumber(userId, sectionId)

  // Stamp the client IP on first save (kept once set), so it shows on the
  // certificate before final submit — mirroring the reference (experience) flow.
  const resolvedIp = (existing['ipAddress'] as string | undefined) || ipAddress || null

  const merged = {
    ...existing,
    ...cleanValues,
    referenceNumber,
    ...(resolvedIp ? { ipAddress: resolvedIp } : {}),
    formDetailCreateTime: existing['formDetailCreateTime'] ?? now,
    formDetailUpdateTime: now,
  }
  const nextLegalData = { ...legalData, agreements: { ...agreements, [key]: merged } }

  if (profile) {
    await db.update(profiles).set({ legalData: nextLegalData }).where(eq(profiles.id, profile.id))
  } else {
    await db.insert(profiles).values({ userId, legalData: nextLegalData })
  }

  return { savedValues: pickAgreementFormValues(merged), referenceNumber, ipAddress: resolvedIp }
}
