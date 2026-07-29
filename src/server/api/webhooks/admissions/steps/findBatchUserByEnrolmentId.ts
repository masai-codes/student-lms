import { desc, eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

const FN = 'findBatchUserByEnrolmentId'

export type FoundBatchUser = {
  id: number
  userId: number
  batchId: number
  meta: string | null
  history: Record<string, unknown> | null
}

/**
 * Locate the `batch_user` for an admissions enrolment by its `enrolment_id`.
 * An enrolment can map to more than one `batch_user` row; to resolve to a single
 * one:
 * - if `lmsBatchUserId` is given, pick the row with that id;
 * - otherwise (or if it matches nothing) pick the latest-created row.
 *
 * Throws `ENROLMENT_NOT_FOUND` (404) when no row matches the enrolment.
 */
export async function findBatchUserByEnrolmentId(
  tx: DbTransaction,
  enrolmentId: number,
  lmsBatchUserId?: number,
): Promise<FoundBatchUser> {
  // Newest first, so the default pick (no lms_batch_user_id) is the latest created.
  const rows = await tx
    .select({
      id: batchUser.id,
      userId: batchUser.userId,
      batchId: batchUser.batchId,
      meta: batchUser.meta,
      history: batchUser.history,
    })
    .from(batchUser)
    .where(eq(batchUser.enrolmentId, enrolmentId))
    .orderBy(desc(batchUser.createdAt))

  if (rows.length === 0) {
    logger.warn({
      msg: 'No batch_user found for enrolment',
      fn: FN,
      enrolmentId,
    })
    throw new ApiError(404, 'ENROLMENT_NOT_FOUND')
  }

  if (lmsBatchUserId != null) {
    const match = rows.find((row) => row.id === lmsBatchUserId)
    if (match) return match
    logger.warn({
      msg: 'lms_batch_user_id not found for enrolment; falling back to latest',
      fn: FN,
      enrolmentId,
      lmsBatchUserId,
      candidateCount: rows.length,
    })
  }

  return rows[0]
}
