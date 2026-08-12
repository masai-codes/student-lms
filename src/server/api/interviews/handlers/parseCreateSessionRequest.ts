import { ApiError } from '@/server/api/http/apiError'
import {
  parseChatLanguage,
  type AiTutorChatLanguage,
} from '@/server/api/ai-tutor/chatLanguage'

export type CreateSessionRequest = {
  topicId: string
  language: AiTutorChatLanguage
}

/**
 * Shared request parsing for both the blocking and streaming create-session
 * routes — reads the request body once (a `Request` body can only be
 * consumed once) and validates both fields from it.
 */
export async function parseCreateSessionRequest(
  request: Request,
): Promise<CreateSessionRequest> {
  const body = (await request.json().catch(() => null)) as {
    topicId?: unknown
    language?: unknown
  } | null

  const topicId = typeof body?.topicId === 'string' ? body.topicId.trim() : ''
  if (!topicId) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')

  const language = parseChatLanguage(body?.language)

  return { topicId, language }
}
