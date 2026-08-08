import { createFileRoute } from '@tanstack/react-router'
import { handleAbandonInterviewSession } from '@/server/api/interviews/handlers/abandonSession.handler'

export const Route = createFileRoute(
  '/api/interviews/sessions/$sessionId/abandon',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleAbandonInterviewSession(params.sessionId),
    },
  },
})
