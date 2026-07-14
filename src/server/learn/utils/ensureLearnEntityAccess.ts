import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { sectionUser } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

/**
 * Learner can open the row if their enrolled batch matches `batchId`, or they belong to `section_id`.
 */
export async function ensureUserCanAccessLearnHubEntity(
  userId: number,
  batchId: number | null,
  sectionId: number | null,
): Promise<boolean> {
  const enrolledBatchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchId != null && enrolledBatchIds.includes(batchId)) {
    return true
  }
  if (sectionId == null) {
    return false
  }

  const membership = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sectionUser.sectionId, sectionId),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)

  return membership.length > 0
}
