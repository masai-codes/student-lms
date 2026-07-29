import { createFileRoute } from '@tanstack/react-router'

import { handleCancelEnrolment } from '@/server/api/webhooks/admissions/handlers/cancelEnrolment.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/cancel-enrolment',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleCancelEnrolment(request),
    },
  },
})
