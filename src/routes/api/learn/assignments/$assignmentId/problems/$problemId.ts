import { createFileRoute } from '@tanstack/react-router'

import { handleGetProblemDetail } from '@/server/api/learn/handlers/getProblemDetail.handler'

export const Route = createFileRoute(
  '/api/learn/assignments/$assignmentId/problems/$problemId',
)({
  server: {
    handlers: {
      GET: ({ params }) =>
        handleGetProblemDetail(params.assignmentId, params.problemId),
    },
  },
})
