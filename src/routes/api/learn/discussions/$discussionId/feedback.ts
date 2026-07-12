import { createFileRoute } from '@tanstack/react-router'

import { handleSubmitLearnDiscussionFeedback } from '@/server/api/learn/handlers/submitLearnDiscussionFeedback.handler'

export const Route = createFileRoute(
  '/api/learn/discussions/$discussionId/feedback',
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSubmitLearnDiscussionFeedback(request, params.discussionId),
    },
  },
})
