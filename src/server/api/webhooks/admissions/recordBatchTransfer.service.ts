import { db } from '@/db'
import { logger } from '@/lib/logger'
import type { BatchTransferInput } from '@/server/api/webhooks/admissions/batchTransfer.schema'
import { applyBatchTransfer } from '@/server/api/webhooks/admissions/steps/applyBatchTransfer'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import type { BatchTransferStatus } from '@/server/api/webhooks/admissions/types'

const FN = 'recordBatchTransfer'

export type BatchTransferResult = {
  batchUserId: number
  batchTransferId: number
  batchTransferStatus: BatchTransferStatus
}

type Options = {
  status: BatchTransferStatus
  payloadType: string
}

/**
 * Shared logic for the three batch-transfer webhooks. Locates the batch_user by
 * enrolment_id (404 if unknown), sets `batch_transfer_id` + `batch_transfer_status`
 * (status supplied by the caller), and stores the payload in the audit trail.
 */
export async function recordBatchTransfer(
  input: BatchTransferInput,
  { status, payloadType }: Options,
): Promise<BatchTransferResult> {
  logger.info({
    msg: 'Processing batch transfer',
    fn: FN,
    enrolmentId: input.enrolment_id,
    batchTransferId: input.batch_transfer_id,
    status,
  })

  return db.transaction(async (tx) => {
    const batchUserRow = await findBatchUserByEnrolmentId(
      tx,
      input.enrolment_id,
    )

    await applyBatchTransfer(tx, {
      batchUserId: batchUserRow.id,
      history: batchUserRow.history,
      batchTransferId: input.batch_transfer_id,
      status,
      payloadType,
      payload: { ...input },
    })

    return {
      batchUserId: batchUserRow.id,
      batchTransferId: input.batch_transfer_id,
      batchTransferStatus: status,
    }
  })
}
