import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { listInterviewSessions } from '@/server/api/interviews/services/interviewSession.service'

export async function handleListInterviewSessions(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessions = await listInterviewSessions(userId)
    return jsonOk(sessions)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to list interview sessions', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_LISTING_INTERVIEW_SESSIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
