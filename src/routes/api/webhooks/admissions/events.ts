import { createFileRoute } from '@tanstack/react-router'

import { handleAdmissionEvent } from '@/server/api/webhooks/admissions/handlers/events.handler'

export const Route = createFileRoute('/api/webhooks/admissions/events')({
  server: {
    handlers: {
      POST: ({ request }) => handleAdmissionEvent(request),
    },
  },
})
