import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { setAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'

export async function handleSetAdminMode(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json().catch(() => null)) as {
      enabled?: unknown
    } | null

    if (typeof body?.enabled !== 'boolean') {
      return mapThrownErrorToResponse(
        new Error('INVALID_ADMIN_MODE_PAYLOAD'),
      )
    }

    const state = await setAdminModeState(userId, body.enabled)
    return jsonOk(state)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update Masaiverse admin mode', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPDATING_ADMIN_MODE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
