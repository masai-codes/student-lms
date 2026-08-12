import { stepCountIs, streamText } from 'ai'
import type { LectureChatMessage } from '@/server/api/ai-tutor/services/buildLectureChatPrompt'
import type { AiTutorFeedbackPlatform } from '@/server/api/ai-tutor/feedbackPlatform'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import type { LectureChatMaterials } from '@/server/api/ai-tutor/types/lectureChatMaterials'
import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'
import type { AiTutorSupportedUiElement } from '@/server/api/ai-tutor/supportedUiElements'
import { getAiTutorChatModel } from '@/server/api/ai-tutor/clients/anthropicModel'
import {
  appendChatPracticeHistory,
  findOrCreateChatPracticeRow,
} from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'
import {
  buildLectureChatMessages,
  buildLectureChatSystemPrompt,
} from '@/server/api/ai-tutor/services/buildLectureChatPrompt'
import { getLectureChatMaterials } from '@/server/api/ai-tutor/services/getLectureChatMaterials.service'
import { createRetrieveLectureContentTool } from '@/server/api/ai-tutor/tools/retrieveLectureContent.tool'
import { createGeneratePracticeQuestionsTool } from '@/server/api/ai-tutor/tools/generatePracticeQuestions.tool'
import { AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME } from '@/server/api/ai-tutor/constants'
import {
  namespacePracticeQuestions,
  parsePracticeQuestionsPayload,
} from '@/server/api/ai-tutor/types/practiceQuestions'

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'practiceQuestions'; payload: PracticeQuestionsPayload }
  | { type: 'done'; chatId: number }

export type StreamLectureChatInput = {
  userId: number
  lectureId: number
  chat: string
  chatId?: number
  platform: AiTutorFeedbackPlatform
  language: AiTutorChatLanguage
  supportedUIElements: Array<AiTutorSupportedUiElement>
}

export type LectureChatStreamContext = {
  chatRow: Awaited<ReturnType<typeof findOrCreateChatPracticeRow>>
  materials: LectureChatMaterials
  systemPrompt: string
  messages: Array<LectureChatMessage>
  chat: string
  platform: AiTutorFeedbackPlatform
  language: AiTutorChatLanguage
  supportedUIElements: Array<AiTutorSupportedUiElement>
}

export async function prepareLectureChatContext(
  input: StreamLectureChatInput,
): Promise<LectureChatStreamContext> {
  const chatRow = await findOrCreateChatPracticeRow({
    userId: input.userId,
    lectureId: input.lectureId,
    chatId: input.chatId,
  })

  const materials = await getLectureChatMaterials(input.lectureId)
  const systemPrompt = buildLectureChatSystemPrompt(
    materials,
    input.language,
    input.supportedUIElements,
  )
  const messages = buildLectureChatMessages({
    chatHistory: chatRow.chatHistory,
    question: input.chat,
  })

  return {
    chatRow,
    materials,
    systemPrompt,
    messages,
    chat: input.chat,
    platform: input.platform,
    language: input.language,
    supportedUIElements: input.supportedUIElements,
  }
}

export async function* streamLectureChatEventsFromContext(
  context: LectureChatStreamContext,
): AsyncGenerator<ChatStreamEvent> {
  const tools = {
    ...(context.materials.ragRetrievalAvailable
      ? createRetrieveLectureContentTool(context.materials.lectureId)
      : {}),
    ...(context.supportedUIElements.includes('quiz')
      ? createGeneratePracticeQuestionsTool()
      : {}),
  }

  const result = streamText({
    model: getAiTutorChatModel(),
    system: context.systemPrompt,
    messages: context.messages,
    tools,
    // Allows: 1 retrieval-tool step + 1 practice-questions-tool step + 1 final-text step.
    stopWhen: stepCountIs(3),
    onError({ error }) {
      console.error('AI tutor Claude stream error', error)
    },
  })

  let aiMessage = ''
  let practiceQuestions: PracticeQuestionsPayload | undefined
  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') {
      if (part.text.length === 0) continue
      aiMessage += part.text
      yield { type: 'token', content: part.text }
      continue
    }
    if (
      part.type === 'tool-result' &&
      part.toolName === AI_TUTOR_PRACTICE_QUESTIONS_TOOL_NAME
    ) {
      const parsed = parsePracticeQuestionsPayload(part.output)
      if (parsed) {
        const quizId = `${context.chatRow.id}-t${context.chatRow.chatHistory.length}`
        practiceQuestions = namespacePracticeQuestions(parsed, quizId)
        yield { type: 'practiceQuestions', payload: practiceQuestions }
      }
    }
  }

  await appendChatPracticeHistory({
    rowId: context.chatRow.id,
    userMessage: context.chat,
    aiMessage,
    platform: context.platform,
    language: context.language,
    existingHistory: context.chatRow.chatHistory,
    practiceQuestions,
  })

  yield { type: 'done', chatId: context.chatRow.id }
}
