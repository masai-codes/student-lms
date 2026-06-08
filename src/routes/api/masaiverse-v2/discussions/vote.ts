import { createFileRoute } from '@tanstack/react-router'
import { handleVoteCommunityDiscussion } from '@/server/api/masaiverse-v2/handlers/voteCommunityDiscussion.handler'

export const Route = createFileRoute('/api/masaiverse-v2/discussions/vote')({
  server: {
    handlers: {
      POST: ({ request }) => handleVoteCommunityDiscussion(request),
    },
  },
})
