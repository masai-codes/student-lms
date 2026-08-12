import { createFileRoute } from '@tanstack/react-router'
import { handleCreateInterviewSttToken } from '@/server/api/interviews/handlers/createSttToken.handler'

export const Route = createFileRoute(
  '/api/interviews/sessions/$sessionId/stt-token',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleCreateInterviewSttToken(params.sessionId),
    },
  },
})
