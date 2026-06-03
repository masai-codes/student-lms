import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, jsonError, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { updateProfile } from '@/server/api/profile/updateProfile.service'
import { getProfile } from '@/server/api/profile/getProfile.service'

export async function handleUpdateProfile(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json()) as Record<string, unknown>

    const payload: { name?: string; mobile?: string } = {}
    if (typeof body.name === 'string') payload.name = body.name
    if (typeof body.mobile === 'string') payload.mobile = body.mobile

    await updateProfile(userId, payload)

    const updated = await getProfile(userId)
    if (!updated) return jsonError(404, 'PROFILE_NOT_FOUND')

    return jsonOk({ profile: updated })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_NAME') {
      return jsonError(400, 'INVALID_NAME', 'Name cannot be empty')
    }
    if (!isApiError(error)) {
      console.error('Failed to update profile', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_UPDATING_PROFILE'))
    }
    return mapThrownErrorToResponse(error)
  }
}
