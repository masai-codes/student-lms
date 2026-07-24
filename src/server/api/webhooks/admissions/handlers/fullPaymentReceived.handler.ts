import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { fullPaymentReceivedSchema } from '@/server/api/webhooks/admissions/fullPaymentReceived.schema'
import { recordFullPaymentReceived } from '@/server/api/webhooks/admissions/fullPaymentReceived.service'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const FN = 'handleFullPaymentReceived'

/**
 * POST /api/webhooks/admissions/batch-full-payment-received
 * Body: `{ enrolment_id, full_fees_paid }`.
 */
export async function handleFullPaymentReceived(
  request: Request,
): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = fullPaymentReceivedSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid full-payment payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
    }

    return jsonOk(await recordFullPaymentReceived(parsed.data))
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({
        msg: 'Unhandled full-payment failure',
        fn: FN,
        err: error,
      })
    }
    return mapThrownErrorToResponse(error)
  }
}
