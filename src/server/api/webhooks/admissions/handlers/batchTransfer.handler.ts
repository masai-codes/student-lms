import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { batchTransferSchema } from '@/server/api/webhooks/admissions/batchTransfer.schema'
import { recordBatchTransfer } from '@/server/api/webhooks/admissions/recordBatchTransfer.service'
import {
  ADMISSION_PAYLOAD_TYPE,
  BATCH_TRANSFER_STATUS,
  type BatchTransferStatus,
} from '@/server/api/webhooks/admissions/types'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

/**
 * The three batch-transfer webhooks are identical apart from the status they
 * write and the audit-trail type they log, so they share one handler factory.
 * Each: `POST /api/webhooks/admissions/batch-transfer-request-<status>` with
 * body `{ enrolment_id, batch_transfer_id }`.
 */
function makeBatchTransferHandler(
  fn: string,
  status: BatchTransferStatus,
  payloadType: string,
) {
  return async function handle(request: Request): Promise<Response> {
    try {
      verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

      const rawBody = await request.json().catch(() => ({}))
      const parsed = batchTransferSchema.safeParse(rawBody)
      if (!parsed.success) {
        logger.warn({
          msg: 'Rejected invalid batch-transfer payload',
          fn,
          issues: parsed.error.issues,
        })
        throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
      }

      return jsonOk(
        await recordBatchTransfer(parsed.data, { status, payloadType }),
      )
    } catch (error) {
      if (!(error instanceof ApiError)) {
        logger.error({
          msg: 'Unhandled batch-transfer failure',
          fn,
          err: error,
        })
      }
      return mapThrownErrorToResponse(error)
    }
  }
}

export const handleBatchTransferConsidered = makeBatchTransferHandler(
  'handleBatchTransferConsidered',
  BATCH_TRANSFER_STATUS.CONSIDERED,
  ADMISSION_PAYLOAD_TYPE.BATCH_TRANSFER_CONSIDERED,
)

export const handleBatchTransferRejected = makeBatchTransferHandler(
  'handleBatchTransferRejected',
  BATCH_TRANSFER_STATUS.REJECTED,
  ADMISSION_PAYLOAD_TYPE.BATCH_TRANSFER_REJECTED,
)

export const handleBatchTransferCompleted = makeBatchTransferHandler(
  'handleBatchTransferCompleted',
  BATCH_TRANSFER_STATUS.COMPLETED,
  ADMISSION_PAYLOAD_TYPE.BATCH_TRANSFER_COMPLETED,
)
