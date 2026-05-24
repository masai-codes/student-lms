import { createFileRoute } from '@tanstack/react-router'

import { handleGetAssignmentLearningDetail } from '@/server/api/learn/handlers/getAssignmentLearningDetail.handler'

export const Route = createFileRoute('/api/learn/assignments/$assignmentId')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetAssignmentLearningDetail(request, params.assignmentId),
    },
  },
})
