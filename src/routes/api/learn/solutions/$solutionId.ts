import { createFileRoute } from '@tanstack/react-router'

import { handleSubmitSolutionLink } from '@/server/api/learn/handlers/solutionSubmissionActions.handler'

export const Route = createFileRoute('/api/learn/solutions/$solutionId')({
  server: {
    handlers: {
      PATCH: ({ request, params }) =>
        handleSubmitSolutionLink(request, params.solutionId),
    },
  },
})
