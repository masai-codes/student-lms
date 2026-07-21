import { createFileRoute } from '@tanstack/react-router'

import { handleMarkSubmissionCompletedWithToken } from '@/server/api/learn/handlers/assignmentDetailActions.handler'

export const Route = createFileRoute(
  '/api/learn/assignments/$assignmentId/mark-completed-with-token',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleMarkSubmissionCompletedWithToken(request, params.assignmentId),
    },
  },
})
