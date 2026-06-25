import { createFileRoute } from '@tanstack/react-router'

import {
  handleAddLectureBookmark,
  handleRemoveLectureBookmark,
} from '@/server/api/learn/handlers/lectureBookmark.handler'

export const Route = createFileRoute('/api/learn/lectures/$lectureId/bookmark')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleAddLectureBookmark(request, params.lectureId),
      DELETE: ({ request, params }) =>
        handleRemoveLectureBookmark(request, params.lectureId),
    },
  },
})
