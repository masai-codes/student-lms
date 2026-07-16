import { createFileRoute } from '@tanstack/react-router'

import { handleSetLearnDiscussionClosed } from '@/server/api/learn/handlers/setLearnDiscussionClosed.handler'

export const Route = createFileRoute(
  '/api/learn/discussions/$discussionId/close',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSetLearnDiscussionClosed(request, params.discussionId),
    },
  },
})
