import { streamText } from 'ai'
import { getAiTutorChatModel } from '@/server/api/ai-tutor/clients/anthropicModel'
import { AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT } from '@/server/api/ai-tutor/constants'
import {
  appendChatPracticeHistory,
  findOrCreateChatPracticeRow,
} from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'
import { buildLectureChatUserPrompt } from '@/server/api/ai-tutor/services/buildLectureChatPrompt'
import { getLectureSummaryForChat } from '@/server/api/ai-tutor/services/lecturesAi.service'

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; chatId: number }

export type StreamLectureChatInput = {
  userId: number
  lectureId: number
  chat: string
  chatId?: number
}

export type LectureChatStreamContext = {
  chatRow: Awaited<ReturnType<typeof findOrCreateChatPracticeRow>>
  userPrompt: string
  chat: string
}

export async function prepareLectureChatContext(
  input: StreamLectureChatInput,
): Promise<LectureChatStreamContext> {
  const chatRow = await findOrCreateChatPracticeRow({
    userId: input.userId,
    lectureId: input.lectureId,
    chatId: input.chatId,
  })

  const summary = await getLectureSummaryForChat(input.lectureId)

  const userPrompt = buildLectureChatUserPrompt({
    summary,
    chatHistory: chatRow.chatHistory,
    question: input.chat,
  })

  return { chatRow, userPrompt, chat: input.chat }
}

export async function* streamLectureChatEventsFromContext(
  context: LectureChatStreamContext,
): AsyncGenerator<ChatStreamEvent> {
  const result = streamText({
    model: getAiTutorChatModel(),
    system: AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT,
    prompt: context.userPrompt,
    onError({ error }) {
      console.error('AI tutor Claude stream error', error)
    },
  })

  let aiMessage = ''
  for await (const chunk of result.textStream) {
    if (chunk.length === 0) continue
    aiMessage += chunk
    yield { type: 'token', content: chunk }
  }

  await appendChatPracticeHistory({
    rowId: context.chatRow.id,
    userMessage: context.chat,
    aiMessage,
    existingHistory: context.chatRow.chatHistory,
  })

  yield { type: 'done', chatId: context.chatRow.id }
}
