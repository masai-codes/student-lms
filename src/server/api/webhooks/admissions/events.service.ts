import { db } from '@/db'
import { logger } from '@/lib/logger'
import type { AdmissionEventInput } from '@/server/api/webhooks/admissions/events.schema'
import {
  applyFeeDeadlineUpdated,
  applyInvoiceGenerated,
} from '@/server/api/webhooks/admissions/steps/applyAdmissionDataEvent'
import { applyTransferEvent } from '@/server/api/webhooks/admissions/steps/applyTransferEvent'
import { appendBatchUserPayloadHistory } from '@/server/api/webhooks/admissions/steps/appendBatchUserPayloadHistory'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { pauseBatchUser } from '@/server/api/webhooks/admissions/steps/pauseBatchUser'
import { unpauseBatchUser } from '@/server/api/webhooks/admissions/steps/unpauseBatchUser'
import { updateAdmissionDataForBatch } from '@/server/api/webhooks/admissions/steps/updateAdmissionDataForBatch'
import {
  ADMISSION_EVENT,
  ADMISSION_PAYLOAD_TYPE,
  type AdmissionEvent,
} from '@/server/api/webhooks/admissions/types'
import { invalidatePortalEnrollmentCache } from '@/server/batches/portalEnrollmentCache'

const FN = 'processAdmissionEvent'

export type AdmissionEventResult = {
  event: AdmissionEvent
  batchUserId: number
}

/**
 * Unified dispatcher for the admissions events webhook. Every event locates the
 * batch_user by `data.enrolment_id` — scoped to `data.client` when admissions
 * sends it, so an enrolment belonging to another client's student reads as
 * unknown — (404 if unknown), dumps the whole envelope
 * into the audit trail, and applies its one mutation — all in a transaction.
 *
 * After the transaction commits, the student's cached enrolment sets are dropped
 * (see {@link invalidatePortalEnrollmentCache}): pause / unpause / cancel flip
 * restriction flags that `getBatchIdsForEnrolledUser` bakes into its cached
 * value, so without this a paused student keeps full access (and an unpaused one
 * stays locked out) for up to the 1h TTL.
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

  const { userId, batchUserId } = await db.transaction(async (tx) => {
    const batchUser = await findBatchUserByEnrolmentId(tx, {
      enrolmentId,
      // `null` from admissions means "not specified" — same as omitted.
      lmsBatchUserId: event.data.lms_batch_user_id ?? undefined,
      client: event.data.client ?? undefined,
    })
    const payload = { ...event }

    switch (event.type) {
      case ADMISSION_EVENT.BATCH_PAID:
        // Receiving this event means the full fee is paid — no payload flag.
        await updateAdmissionDataForBatch(tx, {
          userId: batchUser.userId,
          batchId: batchUser.batchId,
          values: { fullFeesPaid: 1 },
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
      case ADMISSION_EVENT.INVOICE_GENERATED:
        await applyInvoiceGenerated(tx, event, batchUser)
        break
      case ADMISSION_EVENT.FEE_DEADLINE_UPDATED:
        await applyFeeDeadlineUpdated(tx, event, batchUser)
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

    return { userId: batchUser.userId, batchUserId: batchUser.id }
  })

  // Post-commit and unconditional: every event mutates this student's
  // batch_user, and one uniform "drop their cached enrolment sets" rule is
  // cheaper to keep correct than a per-event allowlist. Never throws.
  await invalidatePortalEnrollmentCache(userId)

  logger.info({
    msg: 'Admission event processed',
    fn: FN,
    event: event.type,
    batchUserId,
  })
  return { event: event.type, batchUserId }
}
