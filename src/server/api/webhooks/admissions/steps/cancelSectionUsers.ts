import { and, eq, isNull } from 'drizzle-orm'

import { sections, sectionUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  ENROLMENT_EVENT,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import { appendSectionHistory } from '@/server/api/webhooks/admissions/utils/history'

type Params = {
  userId: number
  batchId: number
}

/**
 * Cancel every currently-active `section_user` the user holds in this batch
 * (found by joining through `sections.batch_id`). Each row is soft-deleted
 * (`deleted_at = now`) with a `cancelled` entry appended to its `meta.history`.
 * Already-deleted rows are skipped, so the operation is idempotent. Returns the
 * ids that were cancelled.
 */
export async function cancelSectionUsers(
  tx: DbTransaction,
  { userId, batchId }: Params,
): Promise<number[]> {
  const now = new Date().toISOString()

  const rows = await tx
    .select({ id: sectionUser.id, meta: sectionUser.meta })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        isNull(sectionUser.deletedAt),
      ),
    )

  const cancelledIds: number[] = []
  for (const row of rows) {
    await tx
      .update(sectionUser)
      .set({
        deletedAt: now,
        updatedAt: now,
        meta: appendSectionHistory(row.meta, {
          type: ENROLMENT_EVENT.CANCELLED,
          date: now,
        }),
      })
      .where(eq(sectionUser.id, row.id))
    cancelledIds.push(row.id)
  }

  logger.info({
    msg: 'Cancelled section_users for enrolment',
    fn: 'cancelSectionUsers',
    userId,
    batchId,
    cancelledCount: cancelledIds.length,
  })

  return cancelledIds
}
