import { db } from '@/db'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type { AdmissionEventInput } from '@/server/api/webhooks/admissions/events.schema'
import { appendBatchUserPayloadHistory } from '@/server/api/webhooks/admissions/steps/appendBatchUserPayloadHistory'
import { applyBatchTransfer } from '@/server/api/webhooks/admissions/steps/applyBatchTransfer'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { pauseBatchUser } from '@/server/api/webhooks/admissions/steps/pauseBatchUser'
import { unpauseBatchUser } from '@/server/api/webhooks/admissions/steps/unpauseBatchUser'
import { updateFullFeesPaid } from '@/server/api/webhooks/admissions/steps/updateFullFeesPaid'
import {
  ADMISSION_EVENT,
  ADMISSION_PAYLOAD_TYPE,
  BATCH_TRANSFER_STATUS,
  type AdmissionEvent,
  type BatchTransferStatus,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'

const FN = 'processAdmissionEvent'

export type AdmissionEventResult = {
  event: AdmissionEvent
  batchUserId: number
}

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

async function applyTransferEvent(
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

/**
 * Unified dispatcher for the admissions events webhook. Every event locates the
 * batch_user by `data.enrolment_id` (404 if unknown), dumps the whole envelope
 * into the audit trail, and applies its one mutation — all in a transaction.
 */
export async function processAdmissionEvent(
  event: AdmissionEventInput,
): Promise<AdmissionEventResult> {
  const enrolmentId = event.data.enrolment_id
  logger.info({
    msg: 'Processing admission event',
    fn: FN,
    event: event.type,
    enrolmentId,
  })

  return db.transaction(async (tx) => {
    const batchUser = await findBatchUserByEnrolmentId(tx, enrolmentId)
    const payload = { ...event }

    switch (event.type) {
      case ADMISSION_EVENT.BATCH_PAID:
        // Receiving this event means the full fee is paid — no payload flag.
        await updateFullFeesPaid(tx, {
          userId: batchUser.userId,
          batchId: batchUser.batchId,
          fullFeesPaid: true,
        })
        await appendBatchUserPayloadHistory(tx, {
          batchUserId: batchUser.id,
          history: batchUser.history,
          type: ADMISSION_PAYLOAD_TYPE.FULL_PAYMENT_RECEIVED,
          payload,
        })
        break
      case ADMISSION_EVENT.BATCH_TRANSFER_CONSIDERED:
      case ADMISSION_EVENT.BATCH_TRANSFER_REJECTED:
      case ADMISSION_EVENT.BATCH_TRANSFER_COMPLETED:
        await applyTransferEvent(tx, event, batchUser)
        break
      case ADMISSION_EVENT.BATCH_PAUSE:
        await pauseBatchUser(tx, {
          batchUserId: batchUser.id,
          meta: batchUser.meta,
          history: batchUser.history,
          payload,
        })
        break
      case ADMISSION_EVENT.BATCH_UNPAUSE:
        await unpauseBatchUser(tx, {
          batchUserId: batchUser.id,
          meta: batchUser.meta,
          history: batchUser.history,
          payload,
        })
        break
    }

    logger.info({
      msg: 'Admission event processed',
      fn: FN,
      event: event.type,
      batchUserId: batchUser.id,
    })
    return { event: event.type, batchUserId: batchUser.id }
  })
}
