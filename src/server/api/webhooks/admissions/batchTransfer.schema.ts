import { z } from 'zod'

/**
 * Shared payload for the three batch-transfer webhooks (considered / rejected /
 * completed). The status differs per endpoint; the body is identical.
 */
export const batchTransferSchema = z.object({
  enrolment_id: z.number().int().positive(),
  batch_transfer_id: z.number().int().positive(),
})

export type BatchTransferInput = z.infer<typeof batchTransferSchema>
