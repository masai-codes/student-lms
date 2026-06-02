import { createFileRoute } from '@tanstack/react-router'
import { handleMarkMasaiverseVisited } from '@/server/api/masaiverse-v2/handlers/markMasaiverseVisited.handler'

export const Route = createFileRoute('/api/masaiverse-v2/visited')({
  server: {
    handlers: {
      POST: ({ request }) => handleMarkMasaiverseVisited(request),
    },
  },
})
