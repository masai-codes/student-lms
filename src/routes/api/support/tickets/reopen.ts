import { createFileRoute } from '@tanstack/react-router'
import { handleReopenTicket } from '@/server/api/support/handlers/tickets.handler'

/** POST /api/support/tickets/reopen — reopen a resolved/closed ticket. */
export const Route = createFileRoute('/api/support/tickets/reopen')({
  server: {
    handlers: {
      POST: ({ request }) => handleReopenTicket(request),
    },
  },
})
