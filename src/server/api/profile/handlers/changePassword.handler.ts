import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, jsonError, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { changePassword } from '@/server/api/profile/changePassword.service'

const ERROR_MAP: Record<string, [number, string]> = {
  PASSWORD_TOO_SHORT: [400, 'Password must be at least 8 characters.'],
  PASSWORD_HAS_SPACE: [400, 'Password cannot contain spaces.'],
  PASSWORD_MISMATCH: [400, 'New password and confirmation do not match.'],
  WRONG_CURRENT_PASSWORD: [400, 'Current password is incorrect.'],
  USER_NOT_FOUND: [404, 'User not found.'],
}

export async function handleChangePassword(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json()) as Record<string, unknown>

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''

    await changePassword(userId, { currentPassword, newPassword, confirmPassword })
    return jsonOk({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      const mapped = ERROR_MAP[error.message]
      if (mapped) return jsonError(mapped[0], error.message, mapped[1])
    }
    if (!isApiError(error)) {
      console.error('Failed to change password', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_CHANGING_PASSWORD'))
    }
    return mapThrownErrorToResponse(error)
  }
}
