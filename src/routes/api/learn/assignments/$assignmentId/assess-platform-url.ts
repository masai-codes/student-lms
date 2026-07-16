import { createFileRoute } from '@tanstack/react-router'

import { handleCreateAssessPlatformUrl } from '@/server/api/learn/handlers/assignmentDetailActions.handler'

export const Route = createFileRoute(
  '/api/learn/assignments/$assignmentId/assess-platform-url',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleCreateAssessPlatformUrl(request, params.assignmentId),
    },
  },
})
