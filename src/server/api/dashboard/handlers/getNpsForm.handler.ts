import { isApiError } from '@/server/api/http/apiError'
import { jsonError, jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getNpsForm } from '@/server/api/dashboard/getNpsForm.service'

export async function handleGetNpsForm(request: Request, formId: string): Promise<Response> {
  try {
    await requireSessionUserId(request)
    const id = Number(formId)
    if (!Number.isInteger(id) || id <= 0) return jsonError(400, 'INVALID_FORM_ID')

    const form = await getNpsForm(id)
    if (!form) return jsonError(404, 'NPS_FORM_NOT_FOUND')

    return jsonOk(form)
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to fetch NPS form', error)
    return mapThrownErrorToResponse(error)
  }
}
