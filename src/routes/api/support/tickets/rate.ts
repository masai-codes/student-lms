import { createFileRoute } from '@tanstack/react-router'
import { handleRateTicket } from '@/server/api/support/handlers/tickets.handler'

/** POST /api/support/tickets/rate — rate a resolved ticket (👍/👎). */
export const Route = createFileRoute('/api/support/tickets/rate')({
  server: {
    handlers: {
      POST: ({ request }) => handleRateTicket(request),
    },
  },
})
