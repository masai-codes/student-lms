import { createFileRoute } from '@tanstack/react-router'

import { handleGetInLectureQuizGradedStatus } from '@/server/api/learn/handlers/getInLectureQuizGradedStatus.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/quiz-status',
)({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetInLectureQuizGradedStatus(request, params.lectureId),
    },
  },
})
