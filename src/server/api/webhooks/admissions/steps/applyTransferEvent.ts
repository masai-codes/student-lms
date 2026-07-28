import { ApiError } from '@/server/api/http/apiError'
import type { AdmissionEventInput } from '@/server/api/webhooks/admissions/events.schema'
import { applyBatchTransfer } from '@/server/api/webhooks/admissions/steps/applyBatchTransfer'
import {
  ADMISSION_EVENT,
  ADMISSION_PAYLOAD_TYPE,
  BATCH_TRANSFER_STATUS,
  type AdmissionEvent,
  type BatchTransferStatus,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'

/** Map a transfer event to the status + audit-trail type it records. */
function transferConfig(event: AdmissionEvent): {
  status: BatchTransferStatus
  payloadType: string
} {
  switch (event) {
    case ADMISSION_EVENT.BATCH_TRANSFER_REJECTED:
      return {
        status: BATCH_TRANSFER_STATUS.REJECTED,
        payloadType: ADMISSION_PAYLOAD_TYPE.BATCH_TRANSFER_REJECTED,
      }
    case ADMISSION_EVENT.BATCH_TRANSFER_COMPLETED:
      return {
        status: BATCH_TRANSFER_STATUS.COMPLETED,
        payloadType: ADMISSION_PAYLOAD_TYPE.BATCH_TRANSFER_COMPLETED,
      }
    default:
      return {
        status: BATCH_TRANSFER_STATUS.CONSIDERED,
        payloadType: ADMISSION_PAYLOAD_TYPE.BATCH_TRANSFER_CONSIDERED,
      }
  }
}

/**
 * Apply a `lms.batch.transfer.{considered,rejected,completed}` event: record the
 * destination batch + status on the batch_user and append the envelope to the
 * audit trail.
 */
export async function applyTransferEvent(
  tx: DbTransaction,
  event: AdmissionEventInput,
  batchUser: { id: number; history: Record<string, unknown> | null },
): Promise<void> {
  // `batch_transfer_id` is populated from the destination batch (`to_batch_id`).
  const toBatchId = event.data.to_batch_id
  if (toBatchId == null) {
    // Guarded by the schema too; belt-and-braces so the type narrows.
    throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
  }
  const { status, payloadType } = transferConfig(event.type)
  await applyBatchTransfer(tx, {
    batchUserId: batchUser.id,
    history: batchUser.history,
    batchTransferId: toBatchId,
    status,
    payloadType,
    payload: { ...event },
  })
}
