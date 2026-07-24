import { db } from '@/db'
import { logger } from '@/lib/logger'
import type { PauseBatchInput } from '@/server/api/webhooks/admissions/pauseBatch.schema'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { pauseBatchUser } from '@/server/api/webhooks/admissions/steps/pauseBatchUser'

const FN = 'pauseBatchEnrolment'

export type PauseBatchResult = {
  batchUserId: number
  batchPausedDate: string
}

/**
 * Pauses an enrolment: locate the batch_user by enrolment_id (404 if unknown),
 * set the `batchPaused` / `batchPausedDate` restriction keys in meta, and store
 * the payload in the audit trail.
 */
export async function pauseBatchEnrolment(
  input: PauseBatchInput,
): Promise<PauseBatchResult> {
  logger.info({
    msg: 'Processing pause batch',
    fn: FN,
    enrolmentId: input.enrolment_id,
  })

  return db.transaction(async (tx) => {
    const batchUserRow = await findBatchUserByEnrolmentId(
      tx,
      input.enrolment_id,
    )

    const batchPausedDate = await pauseBatchUser(tx, {
      batchUserId: batchUserRow.id,
      meta: batchUserRow.meta,
      history: batchUserRow.history,
      payload: { ...input },
    })

    return { batchUserId: batchUserRow.id, batchPausedDate }
  })
}
