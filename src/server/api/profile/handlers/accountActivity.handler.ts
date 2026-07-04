import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCurrentUserSessionId } from '@/server/auth/getCurrentSessionUserId'
import {
  getSessions,
  deleteSession,
  deleteAllSessions,
} from '@/server/api/profile/accountActivity.service'

export async function handleGetSessions(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const currentSessionId = getCurrentUserSessionId()
    const sessions = await getSessions(userId)
    return jsonOk({ sessions, currentSessionId })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch sessions', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_SESSIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleDeleteSession(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const { sessionId } = (await request.json()) as { sessionId: string }
    if (!sessionId)
      return mapThrownErrorToResponse(new Error('MISSING_SESSION_ID'))
    await deleteSession(sessionId, userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to delete session', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_DELETING_SESSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleDeleteAllSessions(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    await deleteAllSessions(userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to delete all sessions', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_DELETING_ALL_SESSIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
