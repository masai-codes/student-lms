import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getAiChatHistory } from '@/server/ai-chat/services/getAiChatHistory'

export async function handleGetAiChatHistory(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const messages = await getAiChatHistory({ userId, lectureId })

    return jsonOk({ messages })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
