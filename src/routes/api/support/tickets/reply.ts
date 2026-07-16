import { createFileRoute } from '@tanstack/react-router'
import { handleAddReply } from '@/server/api/support/handlers/tickets.handler'

/** POST /api/support/tickets/reply — add a student reply to a ticket. */
export const Route = createFileRoute('/api/support/tickets/reply')({
  server: {
    handlers: {
      POST: ({ request }) => handleAddReply(request),
    },
  },
})
