import { and, eq } from 'drizzle-orm'

import { userBatchAdmissionData } from '@/db/schema'
import { logger } from '@/lib/logger'
import type {
  CreateEnrolmentInput,
  DbTransaction,
} from '@/server/api/webhooks/admissions/types'

const FN = 'upsertAdmissionData'

type Params = {
  userId: number
  input: CreateEnrolmentInput
}

/**
 * New-user-journey only: record the admission data for this `(user, batch)`.
 * The pair is unique, so if a row already exists we leave it untouched;
 * otherwise we insert one. `lms_access_date` and `updated_at` are NOT NULL with
 * no DB default, so both are set explicitly.
 */
export async function upsertAdmissionData(
  tx: DbTransaction,
  { userId, input }: Params,
): Promise<void> {
  const batchId = input.batch_id

  const existing = await tx
    .select({ id: userBatchAdmissionData.id })
    .from(userBatchAdmissionData)
    .where(
      and(
        eq(userBatchAdmissionData.userId, userId),
        eq(userBatchAdmissionData.batchId, batchId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    logger.info({
      msg: 'Admission data already exists, skipping',
      fn: FN,
      userId,
      batchId,
    })
    return
  }

  const now = new Date().toISOString()
  await tx.insert(userBatchAdmissionData).values({
    userId,
    batchId,
    idCardUrl: input.id_card_url ?? null,
    seatBlockingFeesPaid: input.seat_blocking_fees_paid ? 1 : 0,
    seatBlockingFeesAmount:
      input.seat_blocking_fees_amount != null
        ? String(input.seat_blocking_fees_amount)
        : null,
    seatBlockingFeesPaidDate: input.seat_blocking_fees_paid_date ?? null,
    seatBlockingFeesInvoice: input.seat_blocking_fees_invoice ?? null,
    studentKitExists: input.student_kit_exists ? 1 : 0,
    courseFeeDeadline: input.course_fee_deadline ?? null,
    paymentUrl: input.payment_url ?? null,
    lmsAccessDate: now,
    meta: { newUserJourney: true },
    createdAt: now,
    updatedAt: now,
  })

  logger.info({
    msg: 'Created admission data for enrolment',
    fn: FN,
    userId,
    batchId,
  })
}
