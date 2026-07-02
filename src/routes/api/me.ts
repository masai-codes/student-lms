import { createFileRoute } from '@tanstack/react-router'
import { handleGetCurrentUser } from '@/server/api/me/handlers/getCurrentUser.handler'

export const Route = createFileRoute('/api/me')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetCurrentUser(request),
    },
  },
})
