import { createFileRoute } from '@tanstack/react-router'
import { handleGetInternalChatbotMessages } from '@/server/api/chatbot/handlers/internal.handler'

export const Route = createFileRoute(
  '/api/chatbot/internal/sessions/$sessionId/messages',
)({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetInternalChatbotMessages(request, params.sessionId),
    },
  },
})

