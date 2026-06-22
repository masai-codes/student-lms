import { createFileRoute } from '@tanstack/react-router'

import { handleUploadSolutionFile } from '@/server/api/learn/handlers/solutionSubmissionActions.handler'

export const Route = createFileRoute('/api/learn/solutions/$solutionId/file')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleUploadSolutionFile(request, params.solutionId),
    },
  },
})
