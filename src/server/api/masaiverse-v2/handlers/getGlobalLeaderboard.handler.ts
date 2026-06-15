import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getGlobalLeaderboard } from '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service'
import { parseLeaderboardPeriod } from '@/server/api/masaiverse-v2/services/leaderboardPeriod'

export async function handleGetGlobalLeaderboard(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const params = new URL(request.url).searchParams
    const limitRaw = params.get('limit')
    const result = await getGlobalLeaderboard({
      currentUserId: userId,
      period: parseLeaderboardPeriod(params.get('period')),
      limit: limitRaw == null ? undefined : Number(limitRaw),
    })
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch global leaderboard', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_GLOBAL_LEADERBOARD'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
