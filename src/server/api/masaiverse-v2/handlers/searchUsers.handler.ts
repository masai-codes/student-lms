import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { searchUsers } from '@/server/api/masaiverse-v2/services/searchUsers.service'

export async function handleSearchUsers(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const query = new URL(request.url).searchParams.get('q') ?? ''
    const users = await searchUsers(userId, query)
    return jsonOk({ users })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to search users', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_SEARCHING_USERS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
