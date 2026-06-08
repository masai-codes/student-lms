import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAchievements } from '@/server/api/profile/achievements.service'

export async function handleGetAchievements(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const achievements = await getAchievements(userId)
    return jsonOk({ achievements })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch achievements', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_ACHIEVEMENTS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
