import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAiTutorConversation } from '@/server/api/ai-tutor/getAiTutorConversation.service'

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function handleGetConversation(
  request: Request,
  chatIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const chatId = parsePositiveInt(chatIdParam)

    if (!chatId) {
      throw new ApiError(400, 'AI_TUTOR_CHAT_ID_INVALID')
    }

    const data = await getAiTutorConversation({ userId, chatId })
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch ai-tutor conversation', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_AI_TUTOR_CONVERSATION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
