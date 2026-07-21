import { createFileRoute } from '@tanstack/react-router'

import { handleUpdateSubmissionCompletion } from '@/server/api/learn/handlers/assignmentDetailActions.handler'

export const Route = createFileRoute('/api/learn/submissions/$submissionId')({
  server: {
    handlers: {
      PATCH: ({ request, params }) =>
        handleUpdateSubmissionCompletion(request, params.submissionId),
    },
  },
})
