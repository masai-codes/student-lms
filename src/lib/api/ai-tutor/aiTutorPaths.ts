export const AI_TUTOR_API = {
  chatStream: '/api/ai-tutor/chat/stream',
  chatFeedback: '/api/ai-tutor/chat/feedback',
  conversations: '/api/ai-tutor/chat/conversations',
  conversation: (chatId: number) =>
    `/api/ai-tutor/chat/conversations/${chatId}`,
} as const
