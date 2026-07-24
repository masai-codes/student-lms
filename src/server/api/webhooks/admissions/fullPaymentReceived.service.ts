import { db } from '@/db'
import { logger } from '@/lib/logger'
import type { FullPaymentReceivedInput } from '@/server/api/webhooks/admissions/fullPaymentReceived.schema'
import { appendBatchUserPayloadHistory } from '@/server/api/webhooks/admissions/steps/appendBatchUserPayloadHistory'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { updateFullFeesPaid } from '@/server/api/webhooks/admissions/steps/updateFullFeesPaid'
import { ADMISSION_PAYLOAD_TYPE } from '@/server/api/webhooks/admissions/types'

const FN = 'recordFullPaymentReceived'

export type FullPaymentReceivedResult = {
  batchUserId: number
  fullFeesPaid: boolean
}

/**
 * Records a full-fee payment for an enrolment: locate the batch_user by
 * enrolment_id (404 if unknown), write `full_fees_paid` onto its admission data
 * (404 if that row is missing), and store the payload in the audit trail.
 */
export async function recordFullPaymentReceived(
  input: FullPaymentReceivedInput,
): Promise<FullPaymentReceivedResult> {
  logger.info({
    msg: 'Processing full payment received',
    fn: FN,
    enrolmentId: input.enrolment_id,
  })

  return db.transaction(async (tx) => {
    const batchUserRow = await findBatchUserByEnrolmentId(
      tx,
      input.enrolment_id,
    )

    await updateFullFeesPaid(tx, {
      userId: batchUserRow.userId,
      batchId: batchUserRow.batchId,
      fullFeesPaid: input.full_fees_paid,
    })

    await appendBatchUserPayloadHistory(tx, {
      batchUserId: batchUserRow.id,
      history: batchUserRow.history,
      type: ADMISSION_PAYLOAD_TYPE.FULL_PAYMENT_RECEIVED,
      payload: { ...input },
    })

    logger.info({
      msg: 'Full payment recorded',
      fn: FN,
      enrolmentId: input.enrolment_id,
      batchUserId: batchUserRow.id,
    })

    return { batchUserId: batchUserRow.id, fullFeesPaid: input.full_fees_paid }
  })
}
