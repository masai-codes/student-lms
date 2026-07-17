import { createFileRoute } from '@tanstack/react-router'

import {
  handleAddAssignmentBookmark,
  handleRemoveAssignmentBookmark,
} from '@/server/api/learn/handlers/assignmentBookmark.handler'

export const Route = createFileRoute(
  '/api/learn/assignments/$assignmentId/bookmark',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleAddAssignmentBookmark(params.assignmentId),
      DELETE: ({ params }) =>
        handleRemoveAssignmentBookmark(params.assignmentId),
    },
  },
})
