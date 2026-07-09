import type { SubmitAiTutorFeedbackResponse } from '@/server/api/ai-tutor/types/feedback'
import { submitChatPracticeFeedback } from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'

export async function submitAiTutorFeedback(input: {
  userId: number
  lectureId: number
  chatId: number
  rating: number
  feedback: string | null
}): Promise<SubmitAiTutorFeedbackResponse> {
  return submitChatPracticeFeedback(input)
}
