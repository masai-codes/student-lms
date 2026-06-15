import { createFileRoute } from '@tanstack/react-router'
import { handleCreateChatbotToken } from '@/server/api/chatbot/handlers/token.handler'

export const Route = createFileRoute('/api/chatbot/$lectureId/token')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleCreateChatbotToken(request, params.lectureId),
    },
  },
})

