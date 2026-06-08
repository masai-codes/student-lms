import { createFileRoute } from '@tanstack/react-router'
import { handleUpdateEvent } from '@/server/api/masaiverse-v2/handlers/updateEvent.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/update')({
  server: {
    handlers: {
      POST: ({ request }) => handleUpdateEvent(request),
    },
  },
})
