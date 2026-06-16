import { createFileRoute } from '@tanstack/react-router'
import { handleEscalateTicket } from '@/server/api/support/handlers/tickets.handler'

/** POST /api/support/tickets/escalate — escalate a ticket up the L1→L5 ladder. */
export const Route = createFileRoute('/api/support/tickets/escalate')({
  server: {
    handlers: {
      POST: ({ request }) => handleEscalateTicket(request),
    },
  },
})
