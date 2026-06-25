import { createFileRoute } from '@tanstack/react-router'

import { handleSubmitLectureFeedback } from '@/server/api/learn/handlers/submitLectureFeedback.handler'

export const Route = createFileRoute('/api/learn/lectures/$lectureId/feedback')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSubmitLectureFeedback(request, params.lectureId),
    },
  },
})
