import { isApiError } from '@/server/api/http/apiError'
import { jsonError, jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitNpsForm } from '@/server/api/dashboard/submitNpsForm.service'
import type { NpsQuestionAnswer } from '@/server/api/dashboard/submitNpsForm.service'

export async function handleSubmitNpsForm(request: Request, formId: string): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const id = Number(formId)
    if (!Number.isInteger(id) || id <= 0) return jsonError(400, 'INVALID_FORM_ID')

    const body = await request.json() as { answers?: Array<NpsQuestionAnswer> }
    const answers = Array.isArray(body?.answers) ? body.answers : []

    const result = await submitNpsForm(id, userId, answers)
    return jsonOk(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'NPS_FORM_NOT_FOUND') {
      return jsonError(404, 'NPS_FORM_NOT_FOUND')
    }
    if (!isApiError(error)) console.error('Failed to submit NPS form', error)
    return mapThrownErrorToResponse(error)
  }
}
