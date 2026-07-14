import { isApiError } from '@/server/api/http/apiError'
import {
  jsonError,
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCurrentUser } from '@/server/api/me/getCurrentUser.service'

export async function handleGetCurrentUser(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const user = await getCurrentUser(userId)
    if (!user) return jsonError(404, 'USER_NOT_FOUND')
    return jsonOk({ user })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch current user', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CURRENT_USER'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
