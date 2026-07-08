import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'

/**
 * All (non-deleted) section IDs a user belongs to, resolved directly via
 * `section_user → sections`. This is the reusable "which sections am I in?"
 * primitive — prefer it over ad-hoc joins.
 *
 * Scoped to the current request's portal (iHub vs Masai) via
 * {@link batchScopeForPortal}: only sections whose batch belongs to the active
 * portal are returned.
 */
export async function getSectionIdsForUser(
  userId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        isNull(sections.deletedAt),
        batchScopeForPortal(),
      ),
    )

  return [...new Set(rows.map((row) => row.sectionId))]
}
