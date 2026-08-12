export const AI_TUTOR_API = {
  chatStream: '/api/ai-tutor/chat/stream',
  chatFeedback: '/api/ai-tutor/chat/feedback',
  conversations: '/api/ai-tutor/chat/conversations',
  conversation: (chatId: number) =>
    `/api/ai-tutor/chat/conversations/${chatId}`,
  practiceQuestionAnswers: '/api/ai-tutor/chat/practice-questions/answers',
  lectureFaqs: (lectureId: number) =>
    `/api/ai-tutor/lectures/${lectureId}/faqs`,
} as const
