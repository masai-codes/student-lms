import { createFileRoute } from '@tanstack/react-router'
import { handlePatchChatbotSession } from '@/server/api/chatbot/handlers/sessions.handler'

export const Route = createFileRoute('/api/chatbot/$lectureId/sessions/$sessionId/')({
  server: {
    handlers: {
      PATCH: ({ request, params }) =>
        handlePatchChatbotSession(request, params.lectureId, params.sessionId),
    },
  },
})

