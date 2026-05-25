import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import {
  jsonOk,
  mapThrownErrorToResponse,
} from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import {
  AI_CHAT_MAX_MESSAGE_LENGTH,
  sendAiChatMessage,
} from '@/server/ai-chat/services/sendAiChatMessage'

const sendMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(AI_CHAT_MAX_MESSAGE_LENGTH),
})

export async function handleSendAiChatMessage(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = sendMessageBodySchema.safeParse(rawBody)
   
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_AI_CHAT_PAYLOAD')
    }

    const result = await sendAiChatMessage({
      userId,
      lectureId,
      message: parsed.data.message,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
