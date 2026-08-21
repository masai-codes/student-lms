import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { getRequestPortal } from '@/server/auth/v2/portalContext'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'
import {
  ENROLLMENT_CACHE_TTL_SECONDS,
  enrolledBatchIdsKey,
} from '@/server/batches/portalEnrollmentCache'
import { cacheGetJson, cacheSetJson } from '@/server/redis/cache'
import { getCancelledBatchIds } from '@/server/restrictions/enrollmentRestrictionScope'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'

/**
 * Resolves batch IDs for a user via section enrollment (section_user → sections.batch_id).
 * This is THE single source of truth for "which batches is this user enrolled in" —
 * prefer it over querying batch_user directly (that data is unreliable).
 *
 * Results are scoped to the current request's portal (iHub vs Masai) via
 * {@link batchScopeForPortal}, so an iHub visitor never sees Masai batches and
 * vice-versa.
 *
 * Batches whose enrolment has been cancelled ({@link getUserBatchRestrictions}) are
 * excluded here — a cancelled enrolment is semantically "no longer enrolled", so the
 * batch disappears from every downstream surface (dashboard, learn listing,
 * announcements, onboarding, banners) in one place. Direct URLs to a cancelled
 * batch's content still resolve to a restriction notice rather than a 404, because
 * `ensureUserCanAccessLearnHubEntity` gates purely on `section_user` membership and
 * does not consult this batch-enrolment set.
 */
export async function getBatchIdsForEnrolledUser(
  userId: number,
): Promise<Array<number>> {
  // Portal is resolved once and used BOTH in the SQL scope and the cache key —
  // the same user has different enrolled batches per portal.
  const portal = getRequestPortal()
  const cacheKey = enrolledBatchIdsKey(userId, portal)

  const cached = await cacheGetJson<Array<number>>(cacheKey)
  if (cached) return cached

  const [rows, restrictions] = await Promise.all([
    db
      .select({ batchId: sections.batchId })
      .from(sectionUser)
      .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
      .innerJoin(batches, eq(sections.batchId, batches.id))
      .where(
        and(
          eq(sectionUser.userId, userId),
          isNull(sectionUser.deletedAt),
          isNull(sections.deletedAt),
          batchScopeForPortal(portal),
        ),
      )
      // Most recently ENROLLED batch first — the program the student joined last
      // leads every listing (my-courses grid, learn batch switcher and its default
      // selection, dropdown order). A student can hold several `section_user` rows
      // per batch (extra sections added later), so the batch's enrolment date is
      // the EARLIEST of them — `min(created_at)` — otherwise being added to one
      // more section of an old program would jump it to the top. Grouping also
      // collapses those rows to one id per batch.
      .groupBy(sections.batchId)
      .orderBy(
        sql`min(${sectionUser.createdAt}) desc`,
        // Deterministic tie-breakers for batches enrolled in the same instant
        // (bulk admission writes). Both must be aggregated under ONLY_FULL_GROUP_BY.
        sql`max(${batches.starting}) desc`,
        sql`max(${batches.id}) desc`,
      ),
    getUserBatchRestrictions(userId),
  ])

  const cancelled = getCancelledBatchIds(restrictions)
  // `GROUP BY` already yields one row per batch; the Set is belt-and-braces.
  const batchIds = [...new Set(rows.map((r) => r.batchId))].filter(
    (batchId) => !cancelled.has(batchId),
  )

  await cacheSetJson(cacheKey, batchIds, ENROLLMENT_CACHE_TTL_SECONDS)
  return batchIds
}
