import { createFileRoute } from '@tanstack/react-router'
import { handleRemoveSession } from '@/server/api/profile/handlers/sessions.handler'

export const Route = createFileRoute('/api/profile/sessions/$sessionId')({
  server: {
    handlers: {
      DELETE: ({ params }) => handleRemoveSession(params.sessionId),
    },
  },
})
