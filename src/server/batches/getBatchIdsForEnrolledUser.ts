import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'

/**
 * Resolves batch IDs for a user via section enrollment (section_user → sections.batch_id).
 * Prefer this over batch_user when batch_user data is unreliable.
 *
 * Results are scoped to the current request's portal (iHub vs Masai) via
 * {@link batchScopeForPortal}, so an iHub visitor never sees Masai batches and
 * vice-versa.
 */
export async function getBatchIdsForEnrolledUser(
  userId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ batchId: sections.batchId })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
        batchScopeForPortal(),
      ),
    )
    .orderBy(asc(sectionUser.createdAt))

  return [...new Set(rows.map((r) => r.batchId))]
}
