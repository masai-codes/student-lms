import { createFileRoute } from '@tanstack/react-router'
import { handleCreateEvent } from '@/server/api/masaiverse-v2/handlers/createEvent.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/create')({
  server: {
    handlers: {
      POST: () => handleCreateEvent(),
    },
  },
})
