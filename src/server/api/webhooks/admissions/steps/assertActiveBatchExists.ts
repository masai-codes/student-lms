import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { batches } from '@/db/schema'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'

/**
 * Guard: the enrolment target must be an existing batch that is active
 * (`active = 1`) and not soft-deleted (`deleted_at IS NULL`). Throws
 * `BATCH_NOT_FOUND` (404) otherwise.
 */
export async function assertActiveBatchExists(batchId: number): Promise<void> {
  const rows = await db
    .select({ id: batches.id })
    .from(batches)
    .where(
      and(
        eq(batches.id, batchId),
        eq(batches.active, 1),
        isNull(batches.deletedAt),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    logger.warn({
      msg: 'Active batch not found for enrolment',
      fn: 'assertActiveBatchExists',
      batchId,
    })
    throw new ApiError(404, 'BATCH_NOT_FOUND')
  }
}
