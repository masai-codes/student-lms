import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { undoCancelEnrolmentSchema } from '@/server/api/webhooks/admissions/undoCancelEnrolment.schema'
import { undoCancelEnrolmentFromAdmissions } from '@/server/api/webhooks/admissions/undoCancelEnrolment.service'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const FN = 'handleUndoCancelEnrolment'

/**
 * POST /api/webhooks/admissions/undo-cancel-enrolment
 *
 * Inbound webhook the admissions platform calls to reverse a cancelled
 * enrolment. Authorized with the shared `ADMISSIONS_API_KEY` secret in the
 * `x-api-key` header. Body is identical to cancel-enrolment:
 * `{ enrolment_id, client?, batch_id? }`. Returns
 * `{ batchUserId, userId, batchId, revivedSectionUserIds, alreadyActive }`.
 */
export async function handleUndoCancelEnrolment(
  request: Request,
): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = undoCancelEnrolmentSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid undo-cancel-enrolment payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
    }

    const result = await undoCancelEnrolmentFromAdmissions(parsed.data)
    return jsonOk(result)
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({
        msg: 'Unhandled undo-cancel-enrolment failure',
        fn: FN,
        err: error,
      })
    }
    return mapThrownErrorToResponse(error)
  }
}
