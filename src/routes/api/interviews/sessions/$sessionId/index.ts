import { createFileRoute } from '@tanstack/react-router'
import { handleGetInterviewSession } from '@/server/api/interviews/handlers/getSession.handler'

export const Route = createFileRoute('/api/interviews/sessions/$sessionId/')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetInterviewSession(params.sessionId),
    },
  },
})
