import { eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

export type FoundBatchUser = {
  id: number
  userId: number
  batchId: number
  history: Record<string, unknown> | null
}

/**
 * Locate the `batch_user` for an admissions enrolment by its `enrolment_id`.
 * Throws `ENROLMENT_NOT_FOUND` (404) when there is no matching row.
 */
export async function findBatchUserByEnrolmentId(
  tx: DbTransaction,
  enrolmentId: number,
): Promise<FoundBatchUser> {
  const rows = await tx
    .select({
      id: batchUser.id,
      userId: batchUser.userId,
      batchId: batchUser.batchId,
      history: batchUser.history,
    })
    .from(batchUser)
    .where(eq(batchUser.enrolmentId, enrolmentId))
    .limit(1)

  const row = rows.at(0)
  if (!row) {
    logger.warn({
      msg: 'No batch_user found for enrolment cancel',
      fn: 'findBatchUserByEnrolmentId',
      enrolmentId,
    })
    throw new ApiError(404, 'ENROLMENT_NOT_FOUND')
  }

  return row
}
