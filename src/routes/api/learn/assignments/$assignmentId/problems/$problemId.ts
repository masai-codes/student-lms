import { createFileRoute } from '@tanstack/react-router'

import { handleGetProblemDetail } from '@/server/api/learn/handlers/getProblemDetail.handler'

export const Route = createFileRoute(
  '/api/learn/assignments/$assignmentId/problems/$problemId',
)({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetProblemDetail(request, params.assignmentId, params.problemId),
    },
  },
})
