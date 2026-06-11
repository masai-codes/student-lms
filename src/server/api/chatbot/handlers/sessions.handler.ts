import { z } from 'zod'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  createChatbotSession,
  getOwnedChatbotSessionById,
  listChatbotSessionsByLecture,
  parseMode,
  updateOwnedChatbotSession,
} from '@/server/api/chatbot/sessions.service'
import { parseLectureId } from '@/server/api/chatbot/utils'

const createSessionBodySchema = z.object({
  lastMode: z.enum(['text', 'voice']).optional(),
})

const patchSessionBodySchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  lastMode: z.enum(['text', 'voice']).optional(),
})

export async function handleListChatbotSessions(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    console.log('userId', userId)
    const lectureId = parseLectureId(lectureIdParam)
    console.log('lectureId', lectureId)
    const sessions = await listChatbotSessionsByLecture({ userId, lectureId })
    console.log('sessions', sessions)
    return jsonOk({ sessions })
  } catch (error) {
    console.error('Error listing chatbot sessions', error)
    return mapThrownErrorToResponse(error)
  }
}

export async function handleCreateChatbotSession(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parseLectureId(lectureIdParam)
    const body = await request.json().catch(() => ({}))
    const parsed = createSessionBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'CHATBOT_INVALID_SESSION_PAYLOAD')
    }
    const session = await createChatbotSession({
      userId,
      lectureId,
      lastMode: parseMode(parsed.data.lastMode),
    })
    return jsonOk(session)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handlePatchChatbotSession(
  request: Request,
  lectureIdParam: string,
  sessionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parseLectureId(lectureIdParam)
    const body = await request.json().catch(() => ({}))
    const parsed = patchSessionBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'CHATBOT_INVALID_SESSION_PATCH')
    }

    const existing = await getOwnedChatbotSessionById({ userId, lectureId, sessionId })
    if (!existing) {
      throw new ApiError(404, 'CHATBOT_SESSION_NOT_FOUND')
    }

    const session = await updateOwnedChatbotSession({
      userId,
      lectureId,
      sessionId,
      patch: {
        title: parsed.data.title,
        lastMode: parsed.data.lastMode ? parseMode(parsed.data.lastMode) : undefined,
      },
    })

    if (!session) {
      throw new ApiError(404, 'CHATBOT_SESSION_NOT_FOUND')
    }
    return jsonOk(session)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

