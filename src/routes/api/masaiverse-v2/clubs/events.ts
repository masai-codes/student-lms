import { createFileRoute } from '@tanstack/react-router'
import { handleGetClubEvents } from '@/server/api/masaiverse-v2/handlers/getClubEvents.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/events')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetClubEvents(request),
    },
  },
})
