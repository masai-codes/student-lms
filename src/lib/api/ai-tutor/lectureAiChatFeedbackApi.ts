import { fetchJson } from '@/lib/api/fetchJson'
import { AI_TUTOR_API } from '@/lib/api/ai-tutor/aiTutorPaths'

export type SubmitLectureAiChatFeedbackInput = {
  lectureId: number
  chatId: number
  rating: 1 | 2 | 3 | 4 | 5
  feedback?: string
}

export type SubmitLectureAiChatFeedbackResponse = {
  success: boolean
  message?: string
  data?: {
    id?: number | string
    chatId: number
    rating: number
  }
}

export async function submitLectureAiChatFeedback(
  input: SubmitLectureAiChatFeedbackInput,
): Promise<SubmitLectureAiChatFeedbackResponse> {
  const body: Record<string, unknown> = {
    lectureId: input.lectureId,
    chatId: input.chatId,
    rating: input.rating,
    platform: 'web',
  }
  if (input.feedback?.trim()) {
    body.feedback = input.feedback.trim()
  }

  return fetchJson<SubmitLectureAiChatFeedbackResponse>(AI_TUTOR_API.chatFeedback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
