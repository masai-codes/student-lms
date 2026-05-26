import { createFileRoute } from '@tanstack/react-router'

import { handleViewSubmissionOnAssessPlatform } from '@/server/api/learn/handlers/assignmentDetailActions.handler'

export const Route = createFileRoute(
  '/api/learn/submissions/$submissionId/view-on-platform',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleViewSubmissionOnAssessPlatform(request, params.submissionId),
    },
  },
})
