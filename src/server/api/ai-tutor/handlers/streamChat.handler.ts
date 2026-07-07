import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import type { AiTutorFeedbackPlatform } from '@/server/api/ai-tutor/feedbackPlatform'
import { ApiError, isApiError } from '@/server/api/http/apiError'
import { mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  createSseResponse,
  createSseStreamFromEvents,
} from '@/server/api/http/sse'
import { ensureAnthropicConfigured } from '@/server/api/ai-tutor/clients/anthropicModel'
import { AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH } from '@/server/api/ai-tutor/constants'
import { parseChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import { parsePlatform } from '@/server/api/ai-tutor/feedbackPlatform'
import {
  prepareLectureChatContext,
  streamLectureChatEventsFromContext,
} from '@/server/api/ai-tutor/streamAiTutorChat.service'

type StreamChatBody = {
  lectureId?: unknown
  chat?: unknown
  chatID?: unknown
  chatId?: unknown
  platform?: unknown
  language?: unknown
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseStreamChatBody(body: StreamChatBody | null): {
  lectureId: number
  chat: string
  chatId?: number
  platform: AiTutorFeedbackPlatform
  language: AiTutorChatLanguage
} {
  const lectureId = parsePositiveInt(body?.lectureId)
  if (!lectureId) {
    throw new ApiError(400, 'AI_TUTOR_LECTURE_ID_INVALID')
  }

  const chat = typeof body?.chat === 'string' ? body.chat.trim() : ''
  if (!chat) {
    throw new ApiError(400, 'AI_TUTOR_CHAT_MESSAGE_EMPTY')
  }
  if (chat.length > AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, 'AI_TUTOR_CHAT_MESSAGE_TOO_LONG')
  }

  const rawChatId = body?.chatID ?? body?.chatId
  let chatId: number | undefined
  if (rawChatId != null && rawChatId !== '') {
    const parsedChatId = parsePositiveInt(rawChatId)
    if (parsedChatId == null) {
      throw new ApiError(400, 'AI_TUTOR_CHAT_ID_INVALID')
    }
    chatId = parsedChatId
  }

  const platform = parsePlatform(body?.platform)
  const language = parseChatLanguage(body?.language)

  return { lectureId, chat, chatId, platform, language }
}

export async function handleStreamChat(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request
      .json()
      .catch(() => null)) as StreamChatBody | null
    const parsed = parseStreamChatBody(body)
    ensureAnthropicConfigured()

    const context = await prepareLectureChatContext({
      userId,
      lectureId: parsed.lectureId,
      chat: parsed.chat,
      chatId: parsed.chatId,
      platform: parsed.platform,
      language: parsed.language,
    })

    const stream = createSseStreamFromEvents(
      streamLectureChatEventsFromContext(context),
    )
    return createSseResponse(stream)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to stream ai-tutor chat', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_STREAMING_AI_TUTOR_CHAT'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
