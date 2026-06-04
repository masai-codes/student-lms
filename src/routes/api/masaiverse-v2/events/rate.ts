import { createFileRoute } from '@tanstack/react-router'
import { handleRateEvent } from '@/server/api/masaiverse-v2/handlers/rateEvent.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/rate')({
  server: {
    handlers: {
      POST: ({ request }) => handleRateEvent(request),
    },
  },
})
