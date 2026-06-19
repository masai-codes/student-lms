import { createFileRoute } from '@tanstack/react-router'
import { handleListTickets } from '@/server/api/support/handlers/tickets.handler'

/** GET /api/support/tickets — the student's tickets for a tab. */
export const Route = createFileRoute('/api/support/tickets')({
  server: {
    handlers: {
      GET: ({ request }) => handleListTickets(request),
    },
  },
})
