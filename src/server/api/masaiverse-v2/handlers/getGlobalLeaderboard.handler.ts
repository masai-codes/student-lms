import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getGlobalLeaderboard } from '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service'

export async function handleGetGlobalLeaderboard(
  request: Request,
): Promise<Response> {
  try {
    await requireSessionUserId(request)
    const limitRaw = new URL(request.url).searchParams.get('limit')
    const limit = limitRaw == null ? undefined : Number(limitRaw)
    const entries = await getGlobalLeaderboard(limit)
    return jsonOk({ entries })
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
