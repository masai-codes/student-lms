import { z } from 'zod'

import { payloadClientSchema } from '@/server/api/webhooks/admissions/payloadClient.schema'

/**
 * Payload the admissions platform sends to the cancel-enrolment webhook.
 * We locate the enrolment by the `enrolment_id` we stored on `batch_user` during
 * create-enrolment, scoped to `client` when it is sent (the student's
 * `users.client` must match, otherwise the enrolment is treated as not found).
 */
export const cancelEnrolmentSchema = z.object({
  enrolment_id: z.number().int().positive(),
  client: payloadClientSchema,
})

export type CancelEnrolmentInput = z.infer<typeof cancelEnrolmentSchema>
