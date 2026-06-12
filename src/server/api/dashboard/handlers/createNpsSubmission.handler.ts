import { isApiError } from '@/server/api/http/apiError'
import { jsonError, jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createNpsSubmission } from '@/server/api/dashboard/createNpsSubmission.service'

export async function handleCreateNpsSubmission(request: Request, formId: string): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const id = Number(formId)
    if (!Number.isInteger(id) || id <= 0) return jsonError(400, 'INVALID_FORM_ID')

    const result = await createNpsSubmission(id, userId)
    return jsonOk(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'NPS_FORM_NOT_FOUND') return jsonError(404, 'NPS_FORM_NOT_FOUND')
    if (!isApiError(error)) console.error('Failed to create NPS submission', error)
    return mapThrownErrorToResponse(error)
  }
}
