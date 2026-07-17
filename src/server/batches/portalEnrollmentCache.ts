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
 * Staleness: enrolment (section_user) is written by experience-api, not here, so
 * student-lms can't invalidate on the write itself — the 1h TTL bounds how long
 * a just-enrolled / just-cancelled batch can be wrong. `invalidatePortalEnrollmentCache`
 * exists so a future student-lms write path (or an internal invalidation
 * endpoint experience-api calls) can clear it immediately.
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
