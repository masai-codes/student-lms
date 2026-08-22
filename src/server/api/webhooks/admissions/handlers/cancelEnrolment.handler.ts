import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { cancelEnrolmentSchema } from '@/server/api/webhooks/admissions/cancelEnrolment.schema'
import { cancelEnrolmentFromAdmissions } from '@/server/api/webhooks/admissions/cancelEnrolment.service'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const FN = 'handleCancelEnrolment'

/**
 * POST /api/webhooks/admissions/cancel-enrolment
 *
 * Inbound webhook the admissions platform calls to cancel an enrolment.
 * Authorized with the shared `ADMISSIONS_API_KEY` secret in the `x-api-key`
 * header. Body: `{ enrolment_id, client?, batch_id? }` — `client` and `batch_id`
 * only narrow which `batch_user` the enrolment resolves to. Returns
 * `{ batchUserId, userId, batchId, cancelledSectionUserIds }`.
 */
export async function handleCancelEnrolment(
  request: Request,
): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = cancelEnrolmentSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid cancel-enrolment payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
    }

    const result = await cancelEnrolmentFromAdmissions(parsed.data)
    return jsonOk(result)
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({
        msg: 'Unhandled cancel-enrolment failure',
        fn: FN,
        err: error,
      })
    }
    return mapThrownErrorToResponse(error)
  }
}
