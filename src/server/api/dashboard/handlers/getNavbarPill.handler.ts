import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getNavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'

export async function handleGetNavbarPill(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const event = await getNavbarPillEvent(userId)
    return jsonOk({ event })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch navbar pill event', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_NAVBAR_PILL'))
    }
    return mapThrownErrorToResponse(error)
  }
}
