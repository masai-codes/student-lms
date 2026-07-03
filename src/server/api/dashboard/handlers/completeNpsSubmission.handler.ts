import { isApiError } from '@/server/api/http/apiError'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { completeNpsSubmission } from '@/server/api/dashboard/completeNpsSubmission.service'

export async function handleCompleteNpsSubmission(
  request: Request,
  formId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(formId)
    if (!Number.isInteger(id) || id <= 0)
      return jsonError(400, 'INVALID_FORM_ID')

    const body = (await request.json()) as { submissionId?: unknown }
    const submissionId = Number(body?.submissionId)
    if (!Number.isInteger(submissionId) || submissionId <= 0)
      return jsonError(400, 'INVALID_SUBMISSION_ID')

    await completeNpsSubmission(submissionId, userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NPS_SUBMISSION_NOT_FOUND')
        return jsonError(404, 'NPS_SUBMISSION_NOT_FOUND')
      if (error.message === 'NPS_SUBMISSION_ALREADY_SUBMITTED')
        return jsonError(409, 'NPS_SUBMISSION_ALREADY_SUBMITTED')
      if (error.message.startsWith('NPS_REQUIRED_QUESTIONS_MISSING'))
        return jsonError(422, error.message)
    }
    if (!isApiError(error))
      console.error('Failed to complete NPS submission', error)
    return mapThrownErrorToResponse(error)
  }
}
