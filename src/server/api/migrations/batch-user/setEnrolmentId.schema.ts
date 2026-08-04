import { z } from 'zod'

/**
 * Payload for the batch-user set-enrolment-id migration. The `batch_user` row is
 * located by the `(batch_id, user_id)` pair and stamped with `enrolment_id`.
 * `overwrite` is required to replace an enrolment id that is already set to a
 * different value — a plain re-run with the same id is always allowed.
 */
export const setBatchUserEnrolmentIdSchema = z.object({
  batch_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  enrolment_id: z.number().int().positive(),
  overwrite: z.boolean().optional().default(false),
})

export type SetBatchUserEnrolmentIdInput = z.infer<
  typeof setBatchUserEnrolmentIdSchema
>
