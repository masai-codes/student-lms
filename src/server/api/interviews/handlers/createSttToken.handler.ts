import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  AI_TUTOR_DEFAULT_CHAT_LANGUAGE,
  parseStoredChatLanguage,
} from '@/server/api/ai-tutor/chatLanguage'
import { requestInterviewSttClientSecret } from '@/server/api/interviews/clients/openaiRealtimeClient'
import { parseSessionId } from '@/server/api/interviews/handlers/parseSubmitTurnRequest'
import { getInterviewSessionRowForUser } from '@/server/api/interviews/services/interviewSession.service'

export async function handleCreateInterviewSttToken(
  sessionIdParam: string | undefined,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessionId = parseSessionId(sessionIdParam)
    const row = await getInterviewSessionRowForUser(userId, sessionId)

    const language =
      parseStoredChatLanguage(row.language) ?? AI_TUTOR_DEFAULT_CHAT_LANGUAGE
    const session = await requestInterviewSttClientSecret(language)
    return jsonOk(session)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to mint interview STT token', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_CREATING_INTERVIEW_STT_TOKEN'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
