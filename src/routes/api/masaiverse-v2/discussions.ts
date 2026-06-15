import { createFileRoute } from '@tanstack/react-router'
import { handleCreateCommunityDiscussion } from '@/server/api/masaiverse-v2/handlers/createCommunityDiscussion.handler'
import { handleListCommunityDiscussions } from '@/server/api/masaiverse-v2/handlers/listCommunityDiscussions.handler'

export const Route = createFileRoute('/api/masaiverse-v2/discussions')({
  server: {
    handlers: {
      GET: ({ request }) => handleListCommunityDiscussions(request),
      POST: ({ request }) => handleCreateCommunityDiscussion(request),
    },
  },
})
