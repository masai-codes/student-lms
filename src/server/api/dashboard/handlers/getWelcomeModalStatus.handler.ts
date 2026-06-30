import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getWelcomeModalStatus } from '@/server/api/dashboard/getWelcomeModalStatus.service'

export async function handleGetWelcomeModalStatus(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const status = await getWelcomeModalStatus(userId)
    return jsonOk(status)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch welcome modal status', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_WELCOME_MODAL_STATUS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
