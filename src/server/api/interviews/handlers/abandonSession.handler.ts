import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parseSessionId } from '@/server/api/interviews/handlers/parseSubmitTurnRequest'
import { abandonInterviewSession } from '@/server/api/interviews/services/interviewSession.service'

export async function handleAbandonInterviewSession(
  sessionIdParam: string | undefined,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessionId = parseSessionId(sessionIdParam)

    await abandonInterviewSession(userId, sessionId)
    return jsonOk({ status: 'abandoned' })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to abandon interview session', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_ABANDONING_INTERVIEW_SESSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
