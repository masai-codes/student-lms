import { createFileRoute } from '@tanstack/react-router'
import { handleStreamCreateInterviewSession } from '@/server/api/interviews/handlers/streamCreateSession.handler'

export const Route = createFileRoute('/api/interviews/sessions/stream')({
  server: {
    handlers: {
      POST: ({ request }) => handleStreamCreateInterviewSession(request),
    },
  },
})
