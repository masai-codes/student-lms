import { createFileRoute } from '@tanstack/react-router'

import { handleSubmitInLecturePollResponse } from '@/server/api/learn/handlers/submitInLecturePollResponse.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/poll-submit',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSubmitInLecturePollResponse(request, params.lectureId),
    },
  },
})
