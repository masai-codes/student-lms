import { createFileRoute } from '@tanstack/react-router'
import { handleGetEventDetail } from '@/server/api/masaiverse-v2/handlers/getEventDetail.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/detail')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetEventDetail(request),
    },
  },
})
