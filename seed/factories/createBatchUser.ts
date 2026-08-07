import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { batchUser } from '@/db/schema'

import { formatMysqlDate } from '../utils/time'

type BatchUserInsert = typeof batchUser.$inferInsert
type BatchUserSelect = typeof batchUser.$inferSelect

export type CreateBatchUserOverrides = Partial<Omit<BatchUserInsert, 'id'>>

/**
 * Inserts a `batch_user` row. No application code reads this table's
 * `status`/`is_active` columns — the only signal that matters is
 * `meta.batchEnrolmentCancelled` (see `getUserBatchRestrictions.ts`), which
 * this factory defaults to `true` since that's the primary reason to seed
 * a `batch_user` row today.
 */
export async function createBatchUser(
  overrides: CreateBatchUserOverrides = {},
): Promise<BatchUserSelect> {
  const { userId, batchId } = overrides
  if (userId == null || batchId == null) {
    throw new Error('createBatchUser requires userId and batchId')
  }

  const values: BatchUserInsert = {
    meta: JSON.stringify({
      batchEnrolmentCancelled: true,
      batchEnrolmentCancelledDate: formatMysqlDate(new Date()),
    }),
    ...overrides,
    userId,
    batchId,
  }

  const [result] = await db.insert(batchUser).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(batchUser)
    .where(eq(batchUser.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load batch user after insert (id=${id})`)
  }

  return row
}
