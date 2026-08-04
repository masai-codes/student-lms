import { z } from 'zod'

/**
 * Payload for the batch-user set-enrolment-id migration. The `batch_user` row is
 * located by the `(batch_id, user_id)` pair and stamped with `enrolment_id`.
 * `overwrite` is required to replace an enrolment id that is already set to a
 * different value — a plain re-run with the same id is always allowed.
 *
 * `overwrite` accepts `null` as "not sent" (callers serialising an unset flag as
 * `null` should not get a 400) and normalises it to `false`.
 */
export const setBatchUserEnrolmentIdSchema = z.object({
  batch_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  enrolment_id: z.number().int().positive(),
  overwrite: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
})

export type SetBatchUserEnrolmentIdInput = z.infer<
  typeof setBatchUserEnrolmentIdSchema
>
