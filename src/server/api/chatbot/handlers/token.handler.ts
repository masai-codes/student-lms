import { z } from 'zod'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { resolveSessionForToken, parseMode } from '@/server/api/chatbot/sessions.service'
import { createChatbotToken } from '@/server/api/chatbot/token.service'
import { parseLectureId } from '@/server/api/chatbot/utils'

const tokenBodySchema = z.object({
  mode: z.enum(['text', 'voice']).optional(),
  sessionId: z.string().trim().min(1).optional(),
})

export async function handleCreateChatbotToken(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parseLectureId(lectureIdParam)
    const body = await request.json().catch(() => ({}))
    const parsed = tokenBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'CHATBOT_INVALID_TOKEN_PAYLOAD')
    }
    const mode = parseMode(parsed.data.mode)
    const session = await resolveSessionForToken({
      requestedSessionId: parsed.data.sessionId,
      lectureId,
      userId,
      mode,
    })
    const token = await createChatbotToken({ mode, sessionId: session.sessionId })
    return jsonOk(token)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

