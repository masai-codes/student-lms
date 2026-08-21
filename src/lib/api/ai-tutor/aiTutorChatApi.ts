import { fetchJson } from '@/lib/api/fetchJson'
import { AI_TUTOR_API } from '@/lib/api/ai-tutor/aiTutorPaths'
import type {
  GetAiTutorConversationResponse,
  ListAiTutorConversationsResponse,
} from '@/server/api/ai-tutor/types/conversation'
import type { AiTutorFeedbackPlatform } from '@/server/api/ai-tutor/feedbackPlatform'
import type { SubmitAiTutorFeedbackResponse } from '@/server/api/ai-tutor/types/feedback'

export type {
  AiTutorChatTurn,
  AiTutorConversationSummary,
  GetAiTutorConversationResponse,
  ListAiTutorConversationsResponse,
} from '@/server/api/ai-tutor/types/conversation'
export type { SubmitAiTutorFeedbackResponse } from '@/server/api/ai-tutor/types/feedback'

export async function listAiTutorConversations(
  lectureId: number,
): Promise<ListAiTutorConversationsResponse> {
  const params = new URLSearchParams({ lectureId: String(lectureId) })
  return fetchJson<ListAiTutorConversationsResponse>(
    `${AI_TUTOR_API.conversations}?${params.toString()}`,
  )
}

export async function getAiTutorConversation(
  chatId: number,
): Promise<GetAiTutorConversationResponse> {
  return fetchJson<GetAiTutorConversationResponse>(
    AI_TUTOR_API.conversation(chatId),
  )
}

export async function submitPracticeQuestionAnswers(input: {
  chatId: number
  quizId: string
  answers: Record<string, string>
}): Promise<void> {
  await fetchJson<{ chatId: number; quizId: string }>(
    AI_TUTOR_API.practiceQuestionAnswers,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}

export async function submitAiTutorFeedback(input: {
  lectureId: number
  chatId: number
  rating: number
  feedback?: string
  platform?: AiTutorFeedbackPlatform
}): Promise<SubmitAiTutorFeedbackResponse> {
  return fetchJson<SubmitAiTutorFeedbackResponse>(AI_TUTOR_API.chatFeedback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
