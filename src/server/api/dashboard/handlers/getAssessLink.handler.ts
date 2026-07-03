import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAssessLink } from '@/server/api/dashboard/getAssessLink.service'

export async function handleGetAssessLink(formId: string): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const id = Number(formId)
    if (!Number.isInteger(id) || id <= 0)
      return jsonOk({ url: null, completed: false })

    const result = await getAssessLink(id, userId)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to get assess link', error)
    return mapThrownErrorToResponse(error)
  }
}
