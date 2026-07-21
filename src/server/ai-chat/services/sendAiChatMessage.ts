import type {
  AiChatMessage,
  SendAiChatMessageResult,
} from '@/server/ai-chat/types'

import { requestOpenAiChatCompletion } from '@/server/ai-chat/clients/openAiChatCompletions'
import { projectHistoryToPromptTurns } from '@/server/ai-chat/services/aiChatHistoryProjection'
import {
  appendChatHistoryEntries,
  loadOrCreateChatRow,
} from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'
import { buildChatPromptMessages } from '@/server/ai-chat/services/buildChatPrompt'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'

export const AI_CHAT_MAX_MESSAGE_LENGTH = 4_000
const HISTORY_TURNS_FOR_PROMPT = 16

/**
 * Text chat send pipeline:
 *   1. Validate access + lecture context.
 *   2. Load (or create) the single `aiChatPracticeQuestions` row for this
 *      (user, lecture).
 *   3. Project prior history into OpenAI prompt turns (text + voice mixed).
 *   4. Call OpenAI.
 *   5. Append the completed turn as a single `{ type: 'text', userMessage,
 *      aiMessage }` entry in the persisted JSON history.
 *   6. Return both messages to the client.
 *
 * Text chat is intentionally independent of the LiveKit voice session — if
 * audio is broken, typed messages still work.
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
    if (error instanceof AiTutorLectureAccessError)
      throw new Error(error.message)
    throw error
  }

  const row = await loadOrCreateChatRow({
    userId: input.userId,
    lectureId: input.lectureId,
  })

  const turns = projectHistoryToPromptTurns(row.chatHistory)
  const recentTurns = turns.slice(-HISTORY_TURNS_FOR_PROMPT)

  const promptMessages = buildChatPromptMessages({
    lectureTitle: lectureContext.context.title,
    lectureSummary: lectureContext.context.transcript,
    history: recentTurns,
    userMessage: trimmed,
  })

  const assistantContent = await requestOpenAiChatCompletion({
    messages: promptMessages,
  })

  const timestamp = Date.now()
  const newEntryIndex = row.chatHistory.length

  await appendChatHistoryEntries({
    rowId: row.id,
    entries: [
      {
        type: 'text',
        userMessage: trimmed,
        aiMessage: assistantContent,
        timestamp,
      },
    ],
  })

  const userMessage: AiChatMessage = {
    id: `text-${row.id}-${newEntryIndex}-u`,
    role: 'user',
    content: trimmed,
    source: 'text',
    timestamp,
  }
  const assistantMessage: AiChatMessage = {
    id: `text-${row.id}-${newEntryIndex}-a`,
    role: 'assistant',
    content: assistantContent,
    source: 'text',
    timestamp: timestamp + 1,
  }

  return { userMessage, assistantMessage }
}
