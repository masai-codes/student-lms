import { cacheDel } from '@/server/redis/cache'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'

/**
 * Cache keys + invalidation for the per-user, per-portal enrolment sets
 * (`getBatchIdsForEnrolledUser` / `getSectionIdsForUser`).
 *
 * Mirrors experience-api's `allowedBatchIds:{userId}:{portal}` cache
 * (`src/utils/ihubAccess.ts`) — same data, same 1h TTL, DIFFERENT key name. The
 * portal is PART of the key on purpose: the same user sees a different set of
 * batches on the iHub site vs the Masai site, so a portal-blind key would leak
 * batches across portals.
 *
 * Staleness: enrolment is written ONLY by this app's admissions webhooks (create
 * / cancel enrolment and the batch paid / transfer / pause / unpause events) —
 * the old LMS no longer mutates it — and each webhook calls
 * {@link invalidatePortalEnrollmentCache} right after its transaction commits,
 * clearing the old LMS's key alongside ours. So every write is visible on the
 * student's next request in both apps, and the 1h TTL is only a backstop for a
 * dropped invalidation (e.g. Redis unreachable mid-webhook).
 */

export const ENROLLMENT_CACHE_TTL_SECONDS = 60 * 60 // 1 hour, matches experience-api

/**
 * Every portal a user's enrolment can be cached under. Exported so tests assert
 * against the same list the invalidation uses instead of hardcoding portals that
 * drift (e.g. `iitj`, which exists on some branches and not others).
 */
export const ENROLLMENT_CACHE_PORTALS: ReadonlyArray<EmailPortal> = [
  'masai',
  'ihub',
]

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

/**
 * experience-api's key for the same "batches this user may see" set. Both apps
 * point at the same Redis instance and db, so a write here must clear the legacy
 * key too — otherwise the old LMS (experience-ui) keeps serving the pre-write
 * batch list from `allowedBatchIds` for up to an hour. experience-api clears it
 * via `invalidateAllowedBatchIdsCache`, which our webhooks never go through.
 */
export function legacyAllowedBatchIdsKey(
  userId: number,
  portal: EmailPortal,
): string {
  return `allowedBatchIds:${userId}:${portal}`
}

/**
 * Clear a user's cached enrolment sets across EVERY portal, in both this app's
 * keys and the old LMS's `allowedBatchIds` key. Never throws (`cacheDel` no-ops
 * when Redis is off or unreachable).
 */
export async function invalidatePortalEnrollmentCache(
  userId: number,
): Promise<void> {
  await cacheDel(
    ...ENROLLMENT_CACHE_PORTALS.map((p) => enrolledBatchIdsKey(userId, p)),
    ...ENROLLMENT_CACHE_PORTALS.map((p) => enrolledSectionIdsKey(userId, p)),
    ...ENROLLMENT_CACHE_PORTALS.map((p) => legacyAllowedBatchIdsKey(userId, p)),
  )
}
