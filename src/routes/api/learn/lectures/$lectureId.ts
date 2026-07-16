import { createFileRoute } from '@tanstack/react-router'

import { handleGetLectureLearningDetail } from '@/server/api/learn/handlers/getLectureLearningDetail.handler'

export const Route = createFileRoute('/api/learn/lectures/$lectureId')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetLectureLearningDetail(params.lectureId),
    },
  },
})
