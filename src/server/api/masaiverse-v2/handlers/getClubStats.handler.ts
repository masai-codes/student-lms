import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClubStats } from '@/server/api/masaiverse-v2/services/getClubStats.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetClubStats(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const clubId = Number(new URL(request.url).searchParams.get('clubId'))
    const stats = await getClubStats(
      clubId,
      undefined,
      await canSeeUnpublished(userId),
    )
    if (!stats) {
      throw new ApiError(404, 'CLUB_NOT_FOUND')
    }
    return jsonOk(stats)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch club stats', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CLUB_STATS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
