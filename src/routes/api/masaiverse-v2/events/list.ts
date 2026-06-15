import { createFileRoute } from '@tanstack/react-router'
import { handleGetEventsList } from '@/server/api/masaiverse-v2/handlers/getEventsList.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/list')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetEventsList(request),
    },
  },
})
