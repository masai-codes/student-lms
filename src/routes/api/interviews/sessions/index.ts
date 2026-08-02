import { createFileRoute } from '@tanstack/react-router'
import { handleCreateInterviewSession } from '@/server/api/interviews/handlers/createSession.handler'
import { handleListInterviewSessions } from '@/server/api/interviews/handlers/listSessions.handler'

export const Route = createFileRoute('/api/interviews/sessions/')({
  server: {
    handlers: {
      GET: () => handleListInterviewSessions(),
      POST: ({ request }) => handleCreateInterviewSession(request),
    },
  },
})
