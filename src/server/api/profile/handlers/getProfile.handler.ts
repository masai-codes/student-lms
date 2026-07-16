import { isApiError } from '@/server/api/http/apiError'
import {
  jsonOk,
  jsonError,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getProfile } from '@/server/api/profile/getProfile.service'

export async function handleGetProfile(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const profile = await getProfile(userId)
    if (!profile) return jsonError(404, 'PROFILE_NOT_FOUND')
    return jsonOk({ profile })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch profile', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_PROFILE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
