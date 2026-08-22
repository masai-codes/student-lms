import { z } from 'zod'

import { payloadClientSchema } from '@/server/api/webhooks/admissions/payloadClient.schema'

/**
 * Payload the admissions platform sends to the cancel-enrolment webhook.
 * We locate the enrolment by the `enrolment_id` we stored on `batch_user` during
 * create-enrolment, scoped to `client` when it is sent (the student's
 * `users.client` must match, otherwise the enrolment is treated as not found).
 *
 * `batch_id` is the same kind of optional scope: when sent, only the
 * `batch_user` rows in that batch can match. It exists because one
 * `enrolment_id` can map to several `batch_user` rows (re-enrolments,
 * transfers); without it the webhook silently cancels the latest-created row,
 * which may not be the batch admissions meant. `.nullish()` for the same reason
 * as `client` — admissions serialises "not sent" as an explicit `null`.
 */
export const cancelEnrolmentSchema = z.object({
  enrolment_id: z.number().int().positive(),
  client: payloadClientSchema,
  batch_id: z.number().int().positive().nullish(),
})

export type CancelEnrolmentInput = z.infer<typeof cancelEnrolmentSchema>
