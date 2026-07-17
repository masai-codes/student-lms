import { createFileRoute } from '@tanstack/react-router'

import { handleMarkLearnDiscussionRead } from '@/server/api/learn/handlers/markLearnDiscussionRead.handler'

export const Route = createFileRoute(
  '/api/learn/discussions/$discussionId/read',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleMarkLearnDiscussionRead(params.discussionId),
    },
  },
})
