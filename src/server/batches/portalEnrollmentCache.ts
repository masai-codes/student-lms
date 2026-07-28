import { cacheDel } from '@/server/redis/cache'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'

/**
 * Cache keys + invalidation for the per-user, per-portal enrolment sets
 * (`getBatchIdsForEnrolledUser` / `getSectionIdsForUser`).
 *
 * Mirrors experience-api's `allowedBatchIds:{userId}:{ihub|masai}` cache. The
 * portal is PART of the key on purpose: the same user sees a different set of
 * batches on the iHub site vs the Masai site, so a portal-blind key would leak
 * batches across portals.
 *
 * Staleness: the admissions webhooks in this app (create / cancel enrolment and
 * the batch paid / transfer / pause / unpause events) call
 * {@link invalidatePortalEnrollmentCache} right after their transaction commits,
 * so those writes take effect on the student's next request. Enrolment written
 * by experience-api directly is NOT visible to us, so the 1h TTL remains the
 * backstop for it.
 */

export const ENROLLMENT_CACHE_TTL_SECONDS = 60 * 60 // 1 hour, matches experience-api

const PORTALS: ReadonlyArray<EmailPortal> = ['masai', 'ihub']

export function enrolledBatchIdsKey(
  userId: number,
  portal: EmailPortal,
): string {
  return `enrolledBatchIds:${userId}:${portal}`
}

export function enrolledSectionIdsKey(
  userId: number,
  portal: EmailPortal,
): string {
  return `enrolledSectionIds:${userId}:${portal}`
}

/** Clear a user's cached enrolment sets across BOTH portals. */
export async function invalidatePortalEnrollmentCache(
  userId: number,
): Promise<void> {
  await cacheDel(
    ...PORTALS.map((p) => enrolledBatchIdsKey(userId, p)),
    ...PORTALS.map((p) => enrolledSectionIdsKey(userId, p)),
  )
}
