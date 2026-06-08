import { createFileRoute } from '@tanstack/react-router'
import { handleSetEventEnrollment } from '@/server/api/masaiverse-v2/handlers/setEventEnrollment.handler'

export const Route = createFileRoute('/api/masaiverse-v2/events/enroll')({
  server: {
    handlers: {
      POST: ({ request }) => handleSetEventEnrollment(request),
    },
  },
})
