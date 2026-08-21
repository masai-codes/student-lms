import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { updatePassword } from '@/server/api/profile/updatePassword.service'

export async function handleUpdatePassword(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json()) as Record<string, unknown>

    if (
      typeof body.currentPassword !== 'string' ||
      typeof body.newPassword !== 'string'
    ) {
      throw new ApiError(400, 'INVALID_PASSWORD_PAYLOAD')
    }

    await updatePassword(userId, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    })

    return jsonOk({ updated: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update password', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPDATING_PASSWORD'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
