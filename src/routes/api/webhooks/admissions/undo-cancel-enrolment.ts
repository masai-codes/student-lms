import { createFileRoute } from '@tanstack/react-router'

import { handleUndoCancelEnrolment } from '@/server/api/webhooks/admissions/handlers/undoCancelEnrolment.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/undo-cancel-enrolment',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleUndoCancelEnrolment(request),
    },
  },
})
