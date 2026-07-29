import { z } from 'zod'

/**
 * Payload the admissions platform sends to the cancel-enrolment webhook.
 * We locate the enrolment purely by the `enrolment_id` we stored on `batch_user`
 * during create-enrolment.
 */
export const cancelEnrolmentSchema = z.object({
  enrolment_id: z.number().int().positive(),
})

export type CancelEnrolmentInput = z.infer<typeof cancelEnrolmentSchema>
