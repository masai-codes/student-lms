import { createFileRoute } from '@tanstack/react-router'

import { handleSetBatchUserEnrolmentId } from '@/server/api/migrations/batch-user/handlers/setEnrolmentId.handler'

export const Route = createFileRoute(
  '/api/migrations/batch-user/set-enrolment-id',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleSetBatchUserEnrolmentId(request),
    },
  },
})
