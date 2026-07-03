import { z } from 'zod'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  listChatbotMessagesBySession,
  upsertChatbotMessage,
} from '@/server/api/chatbot/mongoMessages'
import { getOwnedChatbotSessionById } from '@/server/api/chatbot/sessions.service'
import { parseLectureId } from '@/server/api/chatbot/utils'

const appendMessageBodySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1),
  sourceType: z.string().trim().min(1).max(100),
  livekitId: z.string().trim().min(1).nullable().optional(),
})

async function requireOwnedSession(params: {
  request: Request
  lectureIdParam: string
  sessionId: string
}) {
  const userId = await requireSessionUserId()
  const lectureId = parseLectureId(params.lectureIdParam)
  const session = await getOwnedChatbotSessionById({
    sessionId: params.sessionId,
    lectureId,
    userId,
  })
  if (!session) {
    throw new ApiError(404, 'CHATBOT_SESSION_NOT_FOUND')
  }
  return { session, userId, lectureId }
}

export async function handleGetChatbotMessages(
  request: Request,
  lectureIdParam: string,
  sessionId: string,
): Promise<Response> {
  try {
    await requireOwnedSession({ request, lectureIdParam, sessionId })
    const messages = await listChatbotMessagesBySession(sessionId)
    return jsonOk({ messages })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleAppendChatbotMessage(
  request: Request,
  lectureIdParam: string,
  sessionId: string,
): Promise<Response> {
  try {
    const { userId, lectureId } = await requireOwnedSession({
      request,
      lectureIdParam,
      sessionId,
    })
    const body = await request.json().catch(() => ({}))
    const parsed = appendMessageBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'CHATBOT_INVALID_MESSAGE_PAYLOAD')
    }
    const message = await upsertChatbotMessage({
      sessionId,
      lectureId,
      userId,
      role: parsed.data.role,
      content: parsed.data.content,
      sourceType: parsed.data.sourceType,
      livekitId: parsed.data.livekitId ?? null,
    })
    if (!message) {
      throw new ApiError(400, 'CHATBOT_MESSAGE_EMPTY')
    }
    return jsonOk({ message })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
