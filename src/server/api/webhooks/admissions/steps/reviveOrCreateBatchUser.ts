import { and, eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'
import {
  appendTimelineEntry,
  newTimeline,
} from '@/server/api/webhooks/admissions/utils/history'

const FN = 'reviveOrCreateBatchUser'

type Params = {
  userId: number
  batchId: number
  isIhub: boolean
}

/**
 * Ensure the user has a live `batch_user` row for this batch.
 * - Existing row → revive it (clear `deleted_at`, set `is_active = 1`) and append
 *   a `revived` entry to `history.timeline`.
 * - No row → insert one with a `created` timeline entry.
 *
 * `meta` is a `varchar(300)` column here (not JSON), so the iHub flag is stored
 * as a compact JSON string. Returns the `batch_user` id.
 */
export async function reviveOrCreateBatchUser(
  tx: DbTransaction,
  { userId, batchId, isIhub }: Params,
): Promise<number> {
  const now = new Date().toISOString()
  const meta = JSON.stringify({ isIhub })

  const existing = await tx
    .select({ id: batchUser.id, history: batchUser.history })
    .from(batchUser)
    .where(and(eq(batchUser.userId, userId), eq(batchUser.batchId, batchId)))
    .limit(1)

  const row = existing.at(0)
  if (row) {
    await tx
      .update(batchUser)
      .set({
        deletedAt: null,
        isActive: 1,
        meta,
        history: appendTimelineEntry(row.history, {
          type: 'revived',
          date: now,
        }),
        updatedAt: now,
      })
      .where(eq(batchUser.id, row.id))

    logger.info({
      msg: 'Revived batch_user for enrolment',
      fn: FN,
      batchUserId: row.id,
      userId,
      batchId,
    })
    return row.id
  }

  const [result] = await tx.insert(batchUser).values({
    userId,
    batchId,
    role: 'student',
    isActive: 1,
    meta,
    history: newTimeline({ type: 'created', date: now }),
    createdAt: now,
    updatedAt: now,
  })

  const batchUserId = Number(result.insertId)
  logger.info({
    msg: 'Created batch_user for enrolment',
    fn: FN,
    batchUserId,
    userId,
    batchId,
  })
  return batchUserId
}
