import { createFileRoute } from '@tanstack/react-router'

import { handleCreateLearnDiscussion } from '@/server/api/learn/handlers/createLearnDiscussion.handler'

export const Route = createFileRoute('/api/learn/discussions')({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateLearnDiscussion(request),
    },
  },
})
