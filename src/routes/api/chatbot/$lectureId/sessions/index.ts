import { createFileRoute } from '@tanstack/react-router'
import {
  handleCreateChatbotSession,
  handleListChatbotSessions,
} from '@/server/api/chatbot/handlers/sessions.handler'

export const Route = createFileRoute('/api/chatbot/$lectureId/sessions/')({
  server: {
    handlers: {
      GET: ({ params }) => handleListChatbotSessions(params.lectureId),
      POST: ({ request, params }) =>
        handleCreateChatbotSession(request, params.lectureId),
    },
  },
})
