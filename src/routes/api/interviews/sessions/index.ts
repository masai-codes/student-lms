import { createFileRoute } from '@tanstack/react-router'
import { handleCreateInterviewSession } from '@/server/api/interviews/handlers/createSession.handler'

export const Route = createFileRoute('/api/interviews/sessions/')({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateInterviewSession(request),
    },
  },
})
