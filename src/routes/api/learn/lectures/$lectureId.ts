import { createFileRoute } from '@tanstack/react-router'

import { handleGetLectureLearningDetail } from '@/server/api/learn/handlers/getLectureLearningDetail.handler'

export const Route = createFileRoute('/api/learn/lectures/$lectureId')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetLectureLearningDetail(request, params.lectureId),
    },
  },
})
