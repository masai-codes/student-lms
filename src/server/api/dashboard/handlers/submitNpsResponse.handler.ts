import { isApiError } from '@/server/api/http/apiError'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitNpsResponse } from '@/server/api/dashboard/submitNpsResponse.service'

export async function handleSubmitNpsResponse(
  request: Request,
  formId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(formId)
    if (!Number.isInteger(id) || id <= 0)
      return jsonError(400, 'INVALID_FORM_ID')

    const body = (await request.json()) as {
      submissionId?: unknown
      questionId?: unknown
      response?: unknown
    }
    const submissionId = Number(body?.submissionId)
    const questionId = Number(body?.questionId)
    if (!Number.isInteger(submissionId) || submissionId <= 0)
      return jsonError(400, 'INVALID_SUBMISSION_ID')
    if (!Number.isInteger(questionId) || questionId <= 0)
      return jsonError(400, 'INVALID_QUESTION_ID')
    if (body?.response === undefined) return jsonError(400, 'MISSING_RESPONSE')

    await submitNpsResponse(submissionId, userId, questionId, body.response)
    return jsonOk({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NPS_SUBMISSION_NOT_FOUND')
        return jsonError(404, 'NPS_SUBMISSION_NOT_FOUND')
      if (error.message === 'NPS_SUBMISSION_LOCKED')
        return jsonError(409, 'NPS_SUBMISSION_LOCKED')
      if (error.message === 'NPS_QUESTION_NOT_FOUND')
        return jsonError(404, 'NPS_QUESTION_NOT_FOUND')
    }
    if (!isApiError(error))
      console.error('Failed to submit NPS response', error)
    return mapThrownErrorToResponse(error)
  }
}
