import { z } from 'zod'

import { ADMISSION_EVENT } from '@/server/api/webhooks/admissions/types'

const TRANSFER_EVENTS: string[] = [
  ADMISSION_EVENT.BATCH_TRANSFER_CONSIDERED,
  ADMISSION_EVENT.BATCH_TRANSFER_REJECTED,
  ADMISSION_EVENT.BATCH_TRANSFER_COMPLETED,
]

/**
 * Envelope for the unified admissions events webhook. We only strictly need
 * `type` and `data.enrolment_id` (plus `data.to_batch_id` for transfer events —
 * it becomes `batch_user.batch_transfer_id`); the entire envelope is dumped into
 * the audit trail, so unknown fields are allowed through (`.passthrough()`).
 *
 * Every optional field is `.nullish()`, not `.optional()`: admissions serialises
 * "no value yet" as an explicit `null` (e.g. `full_fees_paid_invoice: null` on a
 * `lms.batch.paid` envelope), and rejecting that would 400 an otherwise valid
 * event over a field it does not even use. The per-event `.refine()` guards below
 * still treat `null` as absent where the field is genuinely required.
 */
export const admissionEventSchema = z
  .object({
    type: z.enum([
      ADMISSION_EVENT.BATCH_PAID,
      ADMISSION_EVENT.BATCH_TRANSFER_CONSIDERED,
      ADMISSION_EVENT.BATCH_TRANSFER_REJECTED,
      ADMISSION_EVENT.BATCH_TRANSFER_COMPLETED,
      ADMISSION_EVENT.BATCH_PAUSE,
      ADMISSION_EVENT.BATCH_UNPAUSE,
      ADMISSION_EVENT.INVOICE_GENERATED,
      ADMISSION_EVENT.FEE_DEADLINE_UPDATED,
    ]),
    data: z
      .object({
        enrolment_id: z.number().int().positive(),
        // Disambiguates when one enrolment maps to several batch_user rows.
        lms_batch_user_id: z.number().int().positive().nullish(),
        to_batch_id: z.number().int().positive().nullish(),
        full_fees_paid_invoice: z.string().trim().min(1).nullish(),
        course_fee_deadline: z.string().trim().min(1).nullish(),
      })
      .passthrough(),
  })
  .passthrough()
  .refine(
    (event) =>
      !TRANSFER_EVENTS.includes(event.type) || event.data.to_batch_id != null,
    {
      path: ['data', 'to_batch_id'],
      message: 'to_batch_id is required for batch transfer events',
    },
  )
  .refine(
    (event) =>
      event.type !== ADMISSION_EVENT.INVOICE_GENERATED ||
      event.data.full_fees_paid_invoice != null,
    {
      path: ['data', 'full_fees_paid_invoice'],
      message: 'full_fees_paid_invoice is required for lms.invoice.generated',
    },
  )
  .refine(
    (event) =>
      event.type !== ADMISSION_EVENT.FEE_DEADLINE_UPDATED ||
      event.data.course_fee_deadline != null,
    {
      path: ['data', 'course_fee_deadline'],
      message: 'course_fee_deadline is required for lms.fee.deadline.updated',
    },
  )

export type AdmissionEventInput = z.infer<typeof admissionEventSchema>
