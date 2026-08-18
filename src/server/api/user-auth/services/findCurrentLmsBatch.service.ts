import { and, desc, eq, isNull, lte } from 'drizzle-orm'

import { db } from '@/db'
import { batchUser, batches } from '@/db/schema'

export type CurrentLmsBatch = {
  id: number
  name: string
  starting: string
  duration: string | null
  program: string | null
}

/**
 * Same "current batch" rule as experience-api getCurrentBatch:
 * batch_user.is_active + batches.active + batches.starting <= today.
 * Any batch qualifies — ending is unused.
 */
export async function findCurrentLmsBatch(
  userId: number,
): Promise<CurrentLmsBatch | null> {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      starting: batches.starting,
      duration: batches.duration,
      program: batches.program,
    })
    .from(batchUser)
    .innerJoin(batches, eq(batchUser.batchId, batches.id))
    .where(
      and(
        eq(batchUser.userId, userId),
        eq(batchUser.isActive, 1),
        isNull(batchUser.deletedAt),
        eq(batches.active, 1),
        lte(batches.starting, today),
      ),
    )
    .orderBy(desc(batchUser.createdAt))
    .limit(1)

  return rows.at(0) ?? null
}
