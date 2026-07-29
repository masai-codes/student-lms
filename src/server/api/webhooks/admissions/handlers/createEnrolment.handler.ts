import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { createEnrolmentSchema } from '@/server/api/webhooks/admissions/createEnrolment.schema'
import { createEnrolmentFromAdmissions } from '@/server/api/webhooks/admissions/createEnrolment.service'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const FN = 'handleCreateEnrolment'

/**
 * POST /api/webhooks/admissions/create-enrolment
 *
 * Inbound webhook the admissions platform calls to enrol a student. Authorized
 * with the shared `ADMISSIONS_API_KEY` secret sent in the `x-api-key` header.
 * On success returns `{ batchUserId, invalidSectionIds }`.
 */
export async function handleCreateEnrolment(
  request: Request,
): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'ADMISSIONS_API_KEY')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = createEnrolmentSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid create-enrolment payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(400, 'INVALID_ENROLMENT_PAYLOAD')
    }

    const result = await createEnrolmentFromAdmissions(parsed.data)
    return jsonOk(result)
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({
        msg: 'Unhandled create-enrolment failure',
        fn: FN,
        err: error,
      })
    }
    return mapThrownErrorToResponse(error)
  }
}
