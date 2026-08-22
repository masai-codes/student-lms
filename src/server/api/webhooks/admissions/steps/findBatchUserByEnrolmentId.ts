import { and, desc, eq } from 'drizzle-orm'

import { batchUser, users } from '@/db/schema'
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

export type FindBatchUserParams = {
  enrolmentId: number
  /** Disambiguates when one enrolment maps to several `batch_user` rows. */
  lmsBatchUserId?: number
  /**
   * When admissions sends it, the student's `users.client` must equal this or
   * the enrolment counts as not found. Omit to match any client.
   */
  client?: string
  /**
   * When admissions sends it, the `batch_user.batch_id` must equal this or the
   * enrolment counts as not found. Omit to match any batch.
   */
  batchId?: number
}

/**
 * Locate the `batch_user` for an admissions enrolment by its `enrolment_id`,
 * optionally scoped to students of one `client` and/or to one `batchId`.
 *
 * An enrolment can map to more than one `batch_user` row; to resolve to a single
 * one:
 * - if `lmsBatchUserId` is given, pick the row with that id;
 * - otherwise (or if it matches nothing) pick the latest-created row.
 *
 * `client` and `batchId` are *additional filters*, applied before that pick:
 * rows whose student belongs to a different client, or which live in a different
 * batch, are excluded outright, so a mismatch throws `ENROLMENT_NOT_FOUND`
 * rather than silently acting on another portal's student or another batch's
 * enrolment. `lmsBatchUserId` cannot escape them either — it only ever selects
 * among the rows that survive both.
 *
 * Throws `ENROLMENT_NOT_FOUND` (404) when no row matches.
 */
export async function findBatchUserByEnrolmentId(
  tx: DbTransaction,
  { enrolmentId, lmsBatchUserId, client, batchId }: FindBatchUserParams,
): Promise<FoundBatchUser> {
  // Newest first, so the default pick (no lms_batch_user_id) is the latest created.
  // The join is unconditional (`user_id` is NOT NULL + FK, so it never drops a
  // row) and only the WHERE clause changes with `client` / `batchId`.
  const rows = await tx
    .select({
      id: batchUser.id,
      userId: batchUser.userId,
      batchId: batchUser.batchId,
      meta: batchUser.meta,
      history: batchUser.history,
    })
    .from(batchUser)
    .innerJoin(users, eq(users.id, batchUser.userId))
    .where(
      and(
        eq(batchUser.enrolmentId, enrolmentId),
        client ? eq(users.client, client) : undefined,
        batchId != null ? eq(batchUser.batchId, batchId) : undefined,
      ),
    )
    .orderBy(desc(batchUser.createdAt))

  if (rows.length === 0) {
    logger.warn({
      msg:
        client || batchId != null
          ? 'No batch_user found for enrolment under this client/batch'
          : 'No batch_user found for enrolment',
      fn: FN,
      enrolmentId,
      client,
      batchId,
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
      client,
      batchId,
      candidateCount: rows.length,
    })
  }

  return rows[0]
}
