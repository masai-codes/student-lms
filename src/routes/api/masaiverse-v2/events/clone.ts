import { createFileRoute } from '@tanstack/react-router'
import { handleCloneEvent } from '@/server/api/masaiverse-v2/handlers/cloneEvent.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/clone')({
  server: {
    handlers: {
      POST: ({ request }) => handleCloneEvent(request),
    },
  },
})
