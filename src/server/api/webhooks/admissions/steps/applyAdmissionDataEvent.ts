import { ApiError } from '@/server/api/http/apiError'
import type { AdmissionEventInput } from '@/server/api/webhooks/admissions/events.schema'
import { appendBatchUserPayloadHistory } from '@/server/api/webhooks/admissions/steps/appendBatchUserPayloadHistory'
import type { FoundBatchUser } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { updateAdmissionDataForBatch } from '@/server/api/webhooks/admissions/steps/updateAdmissionDataForBatch'
import { ADMISSION_PAYLOAD_TYPE } from '@/server/api/webhooks/admissions/types'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

/**
 * The two admissions events that only carry a new `admission_data` value for the
 * enrolment's batch: `lms.invoice.generated` and `lms.fee.deadline.updated`.
 * Both write the value and append the envelope to the batch_user audit trail.
 */

export async function applyInvoiceGenerated(
  tx: DbTransaction,
  event: AdmissionEventInput,
  batchUser: FoundBatchUser,
): Promise<void> {
  const invoice = event.data.full_fees_paid_invoice
  if (invoice == null) {
    // Guarded by the schema too; belt-and-braces so the type narrows.
    throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
  }
  await updateAdmissionDataForBatch(tx, {
    userId: batchUser.userId,
    batchId: batchUser.batchId,
    values: { fullFeesPaidInvoice: invoice },
  })
  await appendBatchUserPayloadHistory(tx, {
    batchUserId: batchUser.id,
    history: batchUser.history,
    type: ADMISSION_PAYLOAD_TYPE.INVOICE_GENERATED,
    payload: { ...event },
  })
}

export async function applyFeeDeadlineUpdated(
  tx: DbTransaction,
  event: AdmissionEventInput,
  batchUser: FoundBatchUser,
): Promise<void> {
  const deadline = event.data.course_fee_deadline
  if (deadline == null) {
    // Guarded by the schema too; belt-and-braces so the type narrows.
    throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
  }
  await updateAdmissionDataForBatch(tx, {
    userId: batchUser.userId,
    batchId: batchUser.batchId,
    values: { courseFeeDeadline: deadline },
  })
  await appendBatchUserPayloadHistory(tx, {
    batchUserId: batchUser.id,
    history: batchUser.history,
    type: ADMISSION_PAYLOAD_TYPE.FEE_DEADLINE_UPDATED,
    payload: { ...event },
  })
}
