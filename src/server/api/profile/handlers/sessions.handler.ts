import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCurrentUserSessionId } from '@/server/auth/getCurrentSessionUserId'
import {
  getSessions,
  removeOtherSessions,
  removeSession,
} from '@/server/api/profile/sessions.service'

export async function handleGetSessions(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessions = await getSessions(userId, getCurrentUserSessionId())
    return jsonOk({ sessions })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch profile sessions', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_SESSIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleRemoveSession(
  sessionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    await removeSession(userId, sessionId, getCurrentUserSessionId())
    return jsonOk({ revoked: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to revoke session', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_REVOKING_SESSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

/** Signs out of every other device, keeping the caller's own session alive. */
export async function handleRemoveOtherSessions(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const revokedCount = await removeOtherSessions(
      userId,
      getCurrentUserSessionId(),
    )
    return jsonOk({ revokedCount })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to revoke other sessions', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_REVOKING_SESSIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
