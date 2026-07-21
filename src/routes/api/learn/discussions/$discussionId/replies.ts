import { createFileRoute } from '@tanstack/react-router'

import { handleAddLearnDiscussionReply } from '@/server/api/learn/handlers/addLearnDiscussionReply.handler'

export const Route = createFileRoute(
  '/api/learn/discussions/$discussionId/replies',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleAddLearnDiscussionReply(request, params.discussionId),
    },
  },
})
