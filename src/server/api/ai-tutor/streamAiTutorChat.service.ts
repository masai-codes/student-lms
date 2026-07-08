import { streamText } from 'ai'
import type { LectureChatMessage } from '@/server/api/ai-tutor/services/buildLectureChatPrompt'
import type { AiTutorFeedbackPlatform } from '@/server/api/ai-tutor/feedbackPlatform'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import { getAiTutorChatModel } from '@/server/api/ai-tutor/clients/anthropicModel'
import {
  appendChatPracticeHistory,
  findOrCreateChatPracticeRow,
} from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'
import {
  buildLectureChatMessages,
  buildLectureChatSystemPrompt,
} from '@/server/api/ai-tutor/services/buildLectureChatPrompt'
import { getLectureSummaryForChat } from '@/server/api/ai-tutor/services/lecturesAi.service'

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; chatId: number }

export type StreamLectureChatInput = {
  userId: number
  lectureId: number
  chat: string
  chatId?: number
  platform: AiTutorFeedbackPlatform
  language: AiTutorChatLanguage
}

export type LectureChatStreamContext = {
  chatRow: Awaited<ReturnType<typeof findOrCreateChatPracticeRow>>
  systemPrompt: string
  messages: Array<LectureChatMessage>
  chat: string
  platform: AiTutorFeedbackPlatform
  language: AiTutorChatLanguage
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

  const systemPrompt = buildLectureChatSystemPrompt(summary, input.language)
  const messages = buildLectureChatMessages({
    chatHistory: chatRow.chatHistory,
    question: input.chat,
  })

  return {
    chatRow,
    systemPrompt,
    messages,
    chat: input.chat,
    platform: input.platform,
    language: input.language,
  }
}

export async function* streamLectureChatEventsFromContext(
  context: LectureChatStreamContext,
): AsyncGenerator<ChatStreamEvent> {
  const result = streamText({
    model: getAiTutorChatModel(),
    system: context.systemPrompt,
    messages: context.messages,
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
    platform: context.platform,
    language: context.language,
    existingHistory: context.chatRow.chatHistory,
  })

  yield { type: 'done', chatId: context.chatRow.id }
}
