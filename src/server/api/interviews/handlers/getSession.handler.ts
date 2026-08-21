import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getInterviewSession } from '@/server/api/interviews/services/interviewSession.service'

function parseSessionId(raw: string | undefined): number {
  const parsed = Number(raw)
  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'INTERVIEW_SESSION_ID_INVALID')
  }
  return parsed
}

export async function handleGetInterviewSession(
  sessionIdParam: string | undefined,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessionId = parseSessionId(sessionIdParam)

    const session = await getInterviewSession(userId, sessionId)
    return jsonOk(session)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch interview session', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_INTERVIEW_SESSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
