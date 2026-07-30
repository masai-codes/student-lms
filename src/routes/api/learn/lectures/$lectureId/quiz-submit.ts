import { createFileRoute } from '@tanstack/react-router'

import { handleEndInLectureQuizAssessment } from '@/server/api/learn/handlers/endInLectureQuizAssessment.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/quiz-submit',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleEndInLectureQuizAssessment(request, params.lectureId),
    },
  },
})
