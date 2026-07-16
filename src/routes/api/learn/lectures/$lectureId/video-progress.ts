import { createFileRoute } from '@tanstack/react-router'

import { handleStoreLectureVideoProgress } from '@/server/api/learn/handlers/storeLectureVideoProgress.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/video-progress',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleStoreLectureVideoProgress(request, params.lectureId),
    },
  },
})
