import { createFileRoute } from '@tanstack/react-router'

import { handleCreateAssignmentSubmission } from '@/server/api/learn/handlers/assignmentDetailActions.handler'

export const Route = createFileRoute(
  '/api/learn/assignments/$assignmentId/submissions',
)({
  server: {
    handlers: {
      POST: ({ params }) =>
        handleCreateAssignmentSubmission(params.assignmentId),
    },
  },
})
