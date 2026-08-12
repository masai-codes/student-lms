import { createFileRoute } from '@tanstack/react-router'

import { handleGetInLecturePollSubmission } from '@/server/api/learn/handlers/getInLecturePollSubmission.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/poll-status',
)({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetInLecturePollSubmission(request, params.lectureId),
    },
  },
})
