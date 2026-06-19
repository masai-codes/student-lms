import { createFileRoute } from '@tanstack/react-router'
import { handleGetTicketThread } from '@/server/api/support/handlers/tickets.handler'

/** GET /api/support/tickets/thread — full conversation for one ticket. */
export const Route = createFileRoute('/api/support/tickets/thread')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetTicketThread(request),
    },
  },
})
