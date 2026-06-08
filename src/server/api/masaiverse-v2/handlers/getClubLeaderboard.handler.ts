import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClubLeaderboard } from '@/server/api/masaiverse-v2/services/getClubLeaderboard.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetClubLeaderboard(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const params = new URL(request.url).searchParams
    const clubId = Number(params.get('clubId'))
    const page = Number(params.get('page') ?? 0)
    const perPageRaw = params.get('perPage')
    const perPage = perPageRaw == null ? undefined : Number(perPageRaw)

    const leaderboard = await getClubLeaderboard(
      clubId,
      page,
      perPage,
      await canSeeUnpublished(userId),
    )
    if (!leaderboard) {
      throw new ApiError(404, 'CLUB_NOT_FOUND')
    }
    return jsonOk(leaderboard)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch club leaderboard', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CLUB_LEADERBOARD'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
