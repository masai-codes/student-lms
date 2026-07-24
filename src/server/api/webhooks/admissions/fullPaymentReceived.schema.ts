import { z } from 'zod'

/**
 * Payload for the batch-full-payment-received webhook. We locate the enrolment
 * by `enrolment_id` and write `full_fees_paid` onto its admission data.
 */
export const fullPaymentReceivedSchema = z.object({
  enrolment_id: z.number().int().positive(),
  full_fees_paid: z.boolean(),
})

export type FullPaymentReceivedInput = z.infer<typeof fullPaymentReceivedSchema>
