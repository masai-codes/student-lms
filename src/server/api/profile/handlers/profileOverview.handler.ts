import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getProfileOverview } from '@/server/api/profile/getProfileOverview.service'
import { updateProfile } from '@/server/api/profile/updateProfile.service'

export async function handleGetProfileOverview(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const profile = await getProfileOverview(userId)
    return jsonOk({ profile })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch profile overview', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_PROFILE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleUpdateProfile(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as Record<string, unknown>

    const result = await updateProfile(userId, {
      name: typeof body.name === 'string' ? body.name : undefined,
      secondaryMobile:
        typeof body.secondaryMobile === 'string'
          ? body.secondaryMobile
          : undefined,
    })

    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update profile', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPDATING_PROFILE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
