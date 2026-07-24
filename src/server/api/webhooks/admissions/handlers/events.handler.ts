import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { admissionEventSchema } from '@/server/api/webhooks/admissions/events.schema'
import { processAdmissionEvent } from '@/server/api/webhooks/admissions/events.service'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const FN = 'handleAdmissionEvent'

/**
 * POST /api/webhooks/admissions/events
 *
 * Unified webhook for admissions batch events. Authorized with the shared
 * `ADMISSIONS_API_KEY` (`x-api-key`). The envelope's `type` selects the action;
 * `data.enrolment_id` locates the enrolment. Handles:
 * `lms.batch.paid`, `lms.batch.transfer.{considered,rejected,completed}`,
 * `lms.batch.pause`, `lms.batch.unpause`. Returns `{ event, batchUserId }`.
 */
export async function handleAdmissionEvent(
  request: Request,
): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = admissionEventSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid admission event payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
    }

    return jsonOk(await processAdmissionEvent(parsed.data))
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({
        msg: 'Unhandled admission event failure',
        fn: FN,
        err: error,
      })
    }
    return mapThrownErrorToResponse(error)
  }
}
