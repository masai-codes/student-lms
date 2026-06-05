import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'

export async function handleGetClubDetail(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const clubId = Number(new URL(request.url).searchParams.get('clubId'))
    const club = await getClubDetail(clubId, userId)
    if (!club) {
      throw new ApiError(404, 'CLUB_NOT_FOUND')
    }
    return jsonOk(club)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch club detail', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CLUB_DETAIL'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
