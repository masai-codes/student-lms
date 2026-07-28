import { createFileRoute } from '@tanstack/react-router'

import { handleGetAdaptiveJoin } from '@/server/api/learn/handlers/adaptiveJoin.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/adaptive-join',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleGetAdaptiveJoin(params.lectureId),
    },
  },
})
