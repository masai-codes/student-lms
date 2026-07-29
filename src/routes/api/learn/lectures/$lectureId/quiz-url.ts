import { createFileRoute } from '@tanstack/react-router'

import { handleGenerateInLectureQuizUrl } from '@/server/api/learn/handlers/generateInLectureQuizUrl.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/quiz-url',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleGenerateInLectureQuizUrl(request, params.lectureId),
    },
  },
})
