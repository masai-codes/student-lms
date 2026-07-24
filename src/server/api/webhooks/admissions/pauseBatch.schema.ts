import { z } from 'zod'

/** Payload for the pause-batch webhook. */
export const pauseBatchSchema = z.object({
  enrolment_id: z.number().int().positive(),
})

export type PauseBatchInput = z.infer<typeof pauseBatchSchema>
