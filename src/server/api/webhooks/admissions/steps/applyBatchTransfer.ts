import { eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import type {
  BatchTransferStatus,
  DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import { appendAdmissionPayload } from '@/server/api/webhooks/admissions/utils/history'

type Params = {
  batchUserId: number
  history: Record<string, unknown> | null
  batchTransferId: number
  status: BatchTransferStatus
  payloadType: string
  payload: Record<string, unknown>
}

/**
 * Record a batch-transfer request on the batch_user: set `batch_transfer_id` +
 * `batch_transfer_status` and append the payload to the audit trail, all in one
 * update. Shared by the considered / rejected / completed webhooks.
 */
export async function applyBatchTransfer(
  tx: DbTransaction,
  {
    batchUserId,
    history,
    batchTransferId,
    status,
    payloadType,
    payload,
  }: Params,
): Promise<void> {
  const now = new Date().toISOString()
  await tx
    .update(batchUser)
    .set({
      batchTransferId,
      batchTransferStatus: status,
      history: appendAdmissionPayload(history, {
        type: payloadType,
        date: now,
        payload,
      }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))

  logger.info({
    msg: 'Recorded batch transfer',
    fn: 'applyBatchTransfer',
    batchUserId,
    batchTransferId,
    status,
  })
}
