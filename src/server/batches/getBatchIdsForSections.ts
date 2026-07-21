import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { batches, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'

/**
 * Maps section IDs to their owning batch ID (`sections.batch_id`). This is the
 * reliable content → batch link (the `batch_id` columns on `lectures`/`assignments`
 * are legacy/unreliable), used to decide which batch's ban applies to a content row.
 *
 * Scoped to the current request's portal via {@link batchScopeForPortal}: a
 * section whose batch belongs to the other portal is omitted from the map, so
 * cross-portal content is never attributed to a batch and thus never surfaced.
 */
export async function getBatchIdsForSections(
  sectionIds: Array<number>,
): Promise<Map<number, number>> {
  if (sectionIds.length === 0) return new Map()

  const rows = await db
    .select({ id: sections.id, batchId: sections.batchId })
    .from(sections)
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(and(inArray(sections.id, sectionIds), batchScopeForPortal()))

  return new Map(rows.map((row) => [row.id, row.batchId]))
}

/** Convenience single-section lookup; returns the section's batch ID or `null`. */
export async function getBatchIdForSection(
  sectionId: number | null,
): Promise<number | null> {
  if (sectionId == null) return null
  const map = await getBatchIdsForSections([sectionId])
  return map.get(sectionId) ?? null
}
