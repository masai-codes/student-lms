import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  parseAnswer,
  parseSessionId,
} from '@/server/api/interviews/handlers/parseSubmitTurnRequest'
import { submitInterviewTurn } from '@/server/api/interviews/services/submitInterviewTurn.service'

export async function handleSubmitInterviewTurn(
  request: Request,
  sessionIdParam: string | undefined,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessionId = parseSessionId(sessionIdParam)
    const answer = await parseAnswer(request)

    const result = await submitInterviewTurn({ userId, sessionId, answer })
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to submit interview turn', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_SUBMITTING_INTERVIEW_TURN'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
