import { eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  BATCH_USER_STATUS,
  ENROLMENT_EVENT,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import { appendTimelineEntry } from '@/server/api/webhooks/admissions/utils/history'

type Params = {
  batchUserId: number
  history: Record<string, unknown> | null
}

/**
 * Cancel a `batch_user`: soft-delete it (`deleted_at = now`), flip it inactive
 * with a cancelled status, and append a `cancelled` entry to `history.timeline`.
 * A later create-enrolment can revive it (clearing `deleted_at`, resetting the
 * status) — the timeline keeps the full cancel/revive audit trail.
 */
export async function cancelBatchUser(
  tx: DbTransaction,
  { batchUserId, history }: Params,
): Promise<void> {
  const now = new Date().toISOString()

  await tx
    .update(batchUser)
    .set({
      deletedAt: now,
      isActive: 0,
      status: BATCH_USER_STATUS.CANCELLED,
      history: appendTimelineEntry(history, {
        type: ENROLMENT_EVENT.CANCELLED,
        date: now,
      }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))

  logger.info({
    msg: 'Cancelled batch_user',
    fn: 'cancelBatchUser',
    batchUserId,
  })
}
