import { and, eq, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { sectionUser, sections } from '@/db/schema'

/** Section IDs the user is enrolled in for a given batch (legacy lectures/assignments API scope). */
export async function getSectionIdsForUserInBatch(
  userId: number,
  batchId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
      ),
    )

  return [...new Set(rows.map((row) => row.sectionId))]
}

export async function getSectionIdsForUserInBatches(
  userId: number,
  batchIds: Array<number>,
): Promise<Array<number>> {
  if (batchIds.length === 0) return []

  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        inArray(sections.batchId, batchIds),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
      ),
    )

  return [...new Set(rows.map((row) => row.sectionId))]
}
