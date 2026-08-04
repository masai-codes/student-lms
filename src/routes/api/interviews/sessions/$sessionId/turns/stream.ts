import { createFileRoute } from '@tanstack/react-router'
import { handleStreamSubmitInterviewTurn } from '@/server/api/interviews/handlers/streamSubmitTurn.handler'

export const Route = createFileRoute(
  '/api/interviews/sessions/$sessionId/turns/stream',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleStreamSubmitInterviewTurn(request, params.sessionId),
    },
  },
})
