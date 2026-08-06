import { createFileRoute } from '@tanstack/react-router'
import { handleSubmitInterviewTurn } from '@/server/api/interviews/handlers/submitTurn.handler'

export const Route = createFileRoute(
  '/api/interviews/sessions/$sessionId/turns',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSubmitInterviewTurn(request, params.sessionId),
    },
  },
})
