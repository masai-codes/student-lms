import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type { SetBatchUserEnrolmentIdInput } from '@/server/api/migrations/batch-user/setEnrolmentId.schema'

const FN = 'setBatchUserEnrolmentId'

export type SetBatchUserEnrolmentIdResult = {
  batchUserId: number
  batchId: number
  userId: number
  previousEnrolmentId: number | null
  enrolmentId: number
  /** false when the row already held this enrolment id, so nothing was written. */
  updated: boolean
}

/**
 * Stamp `enrolment_id` onto the single live `batch_user` row for a
 * `(batch_id, user_id)` pair.
 *
 * Only non-soft-deleted rows are considered. Errors:
 * - 404 `BATCH_USER_NOT_FOUND` — no row for that batch/user combination
 * - 409 `MULTIPLE_BATCH_USER_ROWS` — ambiguous, several live rows match
 * - 409 `ENROLMENT_ID_ALREADY_SET` — a different id is present and `overwrite` is false
 */
export async function setBatchUserEnrolmentId({
  batch_id: batchId,
  user_id: userId,
  enrolment_id: enrolmentId,
  overwrite,
}: SetBatchUserEnrolmentIdInput): Promise<SetBatchUserEnrolmentIdResult> {
  const rows = await db
    .select({
      id: batchUser.id,
      enrolmentId: batchUser.enrolmentId,
    })
    .from(batchUser)
    .where(
      and(
        eq(batchUser.batchId, batchId),
        eq(batchUser.userId, userId),
        isNull(batchUser.deletedAt),
      ),
    )

  if (rows.length === 0) {
    logger.warn({
      msg: 'No batch_user row for batch/user combination',
      fn: FN,
      batchId,
      userId,
    })
    throw new ApiError(
      404,
      'BATCH_USER_NOT_FOUND',
      `No batch_user row found for batch_id ${batchId} and user_id ${userId}`,
    )
  }

  if (rows.length > 1) {
    logger.error({
      msg: 'Multiple batch_user rows for batch/user combination',
      fn: FN,
      batchId,
      userId,
      batchUserIds: rows.map((row) => row.id),
    })
    throw new ApiError(
      409,
      'MULTIPLE_BATCH_USER_ROWS',
      `Found ${rows.length} live batch_user rows for batch_id ${batchId} and user_id ${userId}: ${rows
        .map((row) => row.id)
        .join(', ')}`,
    )
  }

  const row = rows[0]
  const previousEnrolmentId = row.enrolmentId ?? null

  if (previousEnrolmentId === enrolmentId) {
    return {
      batchUserId: row.id,
      batchId,
      userId,
      previousEnrolmentId,
      enrolmentId,
      updated: false,
    }
  }

  if (previousEnrolmentId !== null && !overwrite) {
    throw new ApiError(
      409,
      'ENROLMENT_ID_ALREADY_SET',
      `batch_user ${row.id} already has enrolment_id ${previousEnrolmentId}; pass "overwrite": true to replace it`,
    )
  }

  await db
    .update(batchUser)
    .set({
      enrolmentId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(batchUser.id, row.id))

  logger.info({
    msg: 'Set batch_user enrolment id',
    fn: FN,
    batchUserId: row.id,
    batchId,
    userId,
    previousEnrolmentId,
    enrolmentId,
  })

  return {
    batchUserId: row.id,
    batchId,
    userId,
    previousEnrolmentId,
    enrolmentId,
    updated: true,
  }
}
