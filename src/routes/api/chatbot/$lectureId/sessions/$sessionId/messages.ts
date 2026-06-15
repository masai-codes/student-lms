import { createFileRoute } from '@tanstack/react-router'
import {
  handleAppendChatbotMessage,
  handleGetChatbotMessages,
} from '@/server/api/chatbot/handlers/messages.handler'

export const Route = createFileRoute(
  '/api/chatbot/$lectureId/sessions/$sessionId/messages',
)({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetChatbotMessages(request, params.lectureId, params.sessionId),
      POST: ({ request, params }) =>
        handleAppendChatbotMessage(request, params.lectureId, params.sessionId),
    },
  },
})

