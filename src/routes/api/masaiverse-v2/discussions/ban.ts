import { createFileRoute } from '@tanstack/react-router'
import { handleModerateDiscussion } from '@/server/api/masaiverse-v2/handlers/moderateDiscussion.handler'

export const Route = createFileRoute('/api/masaiverse-v2/discussions/ban')({
  server: {
    handlers: {
      POST: ({ request }) => handleModerateDiscussion(request),
    },
  },
})
