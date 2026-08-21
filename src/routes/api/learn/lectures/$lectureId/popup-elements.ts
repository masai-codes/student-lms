import { createFileRoute } from '@tanstack/react-router'

import { handleGetInLecturePopupElements } from '@/server/api/learn/handlers/getInLecturePopupElements.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/popup-elements',
)({
  server: {
    handlers: {
      GET: ({ params }) => handleGetInLecturePopupElements(params.lectureId),
    },
  },
})
