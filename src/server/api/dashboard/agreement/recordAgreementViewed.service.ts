import { and, eq, isNull } from 'drizzle-orm'
import { istNow, sectionAgreementKey } from './agreementShared'
import { db } from '@/db'
import { profiles, sectionUser } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

/**
 * Stamps the first-view time for a section's agreement, which starts the review
 * countdown (see `AGREEMENT_REVIEW_DAYS`). Idempotent: once `viewTime` is set —
 * or the agreement is already signed — it's left unchanged. Returns the
 * effective `viewTime` (ISO).
 */
export async function recordAgreementViewed(userId: number, sectionId: number): Promise<{ viewTime: string }> {
  const [enrolled] = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), eq(sectionUser.sectionId, sectionId), isNull(sectionUser.deletedAt)))
    .limit(1)
  if (!enrolled) throw new ApiError(403, 'NOT_ENROLLED_IN_SECTION')

  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)
  if (!profile) throw new ApiError(404, 'PROFILE_NOT_FOUND')

  const key = sectionAgreementKey(sectionId)
  const legalData = asRecord(profile.legalData)
  const agreements = asRecord(legalData['agreements'])
  const existing = asRecord(agreements[key])

  const existingViewTime = typeof existing['viewTime'] === 'string' ? existing['viewTime'] : null
  // Don't reset the countdown once it's started or the agreement is signed.
  if (existingViewTime || existing['haveAcceptedLegalAgreement'] === true) {
    return { viewTime: existingViewTime ?? istNow().toISOString() }
  }

  const viewTime = istNow().toISOString()
  await db
    .update(profiles)
    .set({ legalData: { ...legalData, agreements: { ...agreements, [key]: { ...existing, viewTime } } } })
    .where(eq(profiles.id, profile.id))

  return { viewTime }
}
