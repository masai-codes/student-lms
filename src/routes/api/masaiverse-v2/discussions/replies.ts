import { createFileRoute } from '@tanstack/react-router'
import {
  handleCreateDiscussionReply,
  handleListDiscussionReplies,
} from '@/server/api/masaiverse-v2/handlers/discussionReplies.handler'

export const Route = createFileRoute('/api/masaiverse-v2/discussions/replies')({
  server: {
    handlers: {
      GET: ({ request }) => handleListDiscussionReplies(request),
      POST: ({ request }) => handleCreateDiscussionReply(request),
    },
  },
})
