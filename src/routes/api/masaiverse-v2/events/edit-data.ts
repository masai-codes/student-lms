import { createFileRoute } from '@tanstack/react-router'
import { handleGetEventEditData } from '@/server/api/masaiverse-v2/handlers/getEventEditData.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/edit-data')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetEventEditData(request),
    },
  },
})
