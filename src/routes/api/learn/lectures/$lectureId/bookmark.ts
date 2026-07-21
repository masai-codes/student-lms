import { createFileRoute } from '@tanstack/react-router'

import {
  handleAddLectureBookmark,
  handleRemoveLectureBookmark,
} from '@/server/api/learn/handlers/lectureBookmark.handler'

export const Route = createFileRoute('/api/learn/lectures/$lectureId/bookmark')(
  {
    server: {
      handlers: {
        POST: ({ params }) => handleAddLectureBookmark(params.lectureId),
        DELETE: ({ params }) => handleRemoveLectureBookmark(params.lectureId),
      },
    },
  },
)
