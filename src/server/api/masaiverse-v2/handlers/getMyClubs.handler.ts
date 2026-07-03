import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getMyClubs } from '@/server/api/masaiverse-v2/services/getMyClubs.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetMyClubs(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const clubs = await getMyClubs(userId, await canSeeUnpublished(userId))
    return jsonOk({ clubs })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch my clubs', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_MY_CLUBS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
