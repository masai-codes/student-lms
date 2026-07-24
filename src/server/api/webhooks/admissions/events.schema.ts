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
    ]),
    data: z
      .object({
        enrolment_id: z.number().int().positive(),
        to_batch_id: z.number().int().positive().optional(),
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

export type AdmissionEventInput = z.infer<typeof admissionEventSchema>
