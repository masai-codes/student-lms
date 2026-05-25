import type { AiChatMessage, SendAiChatMessageResult } from '@/server/ai-chat/types'

import { requestOpenAiChatCompletion } from '@/server/ai-chat/clients/openAiChatCompletions'
import { buildChatPromptMessages } from '@/server/ai-chat/services/buildChatPrompt'
import {
  insertAiChatMessage,
  listRecentAiChatMessagesForContext,
} from '@/server/ai-chat/services/aiChatMessages.repo'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'

export const AI_CHAT_MAX_MESSAGE_LENGTH = 4_000
const HISTORY_TURNS_FOR_PROMPT = 16

function toClientMessage(row: {
  id: number
  role: 'user' | 'assistant'
  content: string
  source: 'text' | 'voice'
  createdAt: string
}): AiChatMessage {
  const epoch = new Date(`${row.createdAt}Z`).getTime()
  return {
    id: `db-${row.id}`,
    role: row.role,
    content: row.content,
    source: row.source,
    timestamp: Number.isFinite(epoch) ? epoch : Date.now(),
  }
}

/**
 * Persists a student message, asks OpenAI for a reply using lecture context,
 * persists the reply, and returns both turns. Voice transcripts live on the
 * LiveKit token server and are merged into the unified history at read time.
 */
export async function sendAiChatMessage(input: {
  userId: number
  lectureId: number
  message: string
}): Promise<SendAiChatMessageResult> {
  const trimmed = input.message.trim()
  if (!trimmed) throw new Error('AI_CHAT_MESSAGE_EMPTY')
  if (trimmed.length > AI_CHAT_MAX_MESSAGE_LENGTH) {
    throw new Error('AI_CHAT_MESSAGE_TOO_LONG')
  }

  let lectureContext
  try {
    lectureContext = await resolveAiTutorLectureContext({
      userId: input.userId,
      lectureId: input.lectureId,
    })
  } catch (error) {
    if (error instanceof AiTutorLectureAccessError) throw new Error(error.message)
    throw error
  }

  const history = await listRecentAiChatMessagesForContext({
    userId: input.userId,
    lectureId: input.lectureId,
    limit: HISTORY_TURNS_FOR_PROMPT,
  })

  const userRow = await insertAiChatMessage({
    userId: input.userId,
    lectureId: input.lectureId,
    role: 'user',
    source: 'text',
    content: trimmed,
  })

  const messages = buildChatPromptMessages({
    lectureTitle: lectureContext.context.title,
    lectureSummary: lectureContext.context.transcript,
    history,
    userMessage: trimmed,
  })

  const assistantContent = await requestOpenAiChatCompletion({ messages })

  const assistantRow = await insertAiChatMessage({
    userId: input.userId,
    lectureId: input.lectureId,
    role: 'assistant',
    source: 'text',
    content: assistantContent,
  })

  return {
    userMessage: toClientMessage(userRow),
    assistantMessage: toClientMessage(assistantRow),
  }
}
