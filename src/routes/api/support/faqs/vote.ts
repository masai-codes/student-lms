import { createFileRoute } from '@tanstack/react-router'
import { handleVoteFaq } from '@/server/api/support/handlers/faqs.handler'

/** POST /api/support/faqs/vote — record an FAQ helpfulness vote. */
export const Route = createFileRoute('/api/support/faqs/vote')({
  server: {
    handlers: {
      POST: ({ request }) => handleVoteFaq(request),
    },
  },
})
