import { createFileRoute } from '@tanstack/react-router'
import { handleCreateTicket } from '@/server/api/support/handlers/tickets.handler'

/** POST /api/support/tickets/create — raise a new ticket. */
export const Route = createFileRoute('/api/support/tickets/create')({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateTicket(request),
    },
  },
})
