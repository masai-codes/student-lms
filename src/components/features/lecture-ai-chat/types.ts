import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'

export type LectureAiChatRole = 'user' | 'assistant'

export type LectureAiChatMessageStatus =
  | 'sent'
  | 'thinking'
  | 'streaming'
  | 'completed'
  | 'error'

export type LectureAiChatMessage = {
  id: string
  role: LectureAiChatRole
  content: string
  status: LectureAiChatMessageStatus
  /** Epoch ms — used only for stable ordering. */
  createdAt: number
  /** Set when this reply is a practice-questions quiz card instead of/alongside text. */
  practiceQuestions?: PracticeQuestionsPayload
  /**
   * True only for the turn in which `practiceQuestions` just streamed in live —
   * never set for quizzes loaded from history. Drives auto-opening the quiz
   * modal once, without reopening it every time a past conversation is loaded.
   */
  practiceQuestionsJustGenerated?: boolean
}
