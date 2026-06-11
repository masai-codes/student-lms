import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { listChatbotMessagesBySession } from '@/server/api/chatbot/mongoMessages'
import { getChatbotSessionById } from '@/server/api/chatbot/sessions.service'
import { requireInternalApiKey } from '@/server/api/chatbot/utils'

export async function handleGetInternalChatbotMessages(
  request: Request,
  sessionId: string,
): Promise<Response> {
  try {
    requireInternalApiKey(request)
    const session = await getChatbotSessionById(sessionId)
    if (!session) {
      throw new ApiError(404, 'CHATBOT_SESSION_NOT_FOUND')
    }
    const messages = await listChatbotMessagesBySession(sessionId)
    return jsonOk({ messages })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

