import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { pauseBatchSchema } from '@/server/api/webhooks/admissions/pauseBatch.schema'
import { pauseBatchEnrolment } from '@/server/api/webhooks/admissions/pauseBatch.service'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const FN = 'handlePauseBatch'

/**
 * POST /api/webhooks/admissions/pause-batch
 * Body: `{ enrolment_id }`.
 */
export async function handlePauseBatch(request: Request): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = pauseBatchSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid pause-batch payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
    }

    return jsonOk(await pauseBatchEnrolment(parsed.data))
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({ msg: 'Unhandled pause-batch failure', fn: FN, err: error })
    }
    return mapThrownErrorToResponse(error)
  }
}
