import { createFileRoute } from '@tanstack/react-router'

import { handleCreateLearnDiscussion } from '@/server/api/learn/handlers/createLearnDiscussion.handler'
import { handleListLearnDiscussions } from '@/server/api/learn/handlers/listLearnDiscussions.handler'

export const Route = createFileRoute('/api/learn/discussions')({
  server: {
    handlers: {
      GET: ({ request }) => handleListLearnDiscussions(request),
      POST: ({ request }) => handleCreateLearnDiscussion(request),
    },
  },
})
