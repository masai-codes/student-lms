import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'

export type AiTutorConversationSummary = {
  chatId: number
  title: string
  updatedAt: string
}

export type ListAiTutorConversationsResponse = {
  conversations: Array<AiTutorConversationSummary>
}

export type AiTutorChatTurn = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: number
  practiceQuestions?: PracticeQuestionsPayload
}

export type GetAiTutorConversationResponse = {
  chatId: number
  chat: Array<AiTutorChatTurn>
}
