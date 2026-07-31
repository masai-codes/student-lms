import { createFileRoute } from '@tanstack/react-router'

import { handleCreateEnrolment } from '@/server/api/webhooks/admissions/handlers/createEnrolment.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/create-enrolment',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateEnrolment(request),
    },
  },
})
