import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'

export async function handleGetAdminMode(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const state = await getAdminModeState(userId)
    return jsonOk(state)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch Masaiverse admin mode', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_ADMIN_MODE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
