import { createFileRoute } from '@tanstack/react-router'
import { handleAwardManualPoints } from '@/server/api/masaiverse-v2/handlers/awardManualPoints.handler'

export const Route = createFileRoute('/api/masaiverse-v2/award-points')({
  server: {
    handlers: {
      POST: ({ request }) => handleAwardManualPoints(request),
    },
  },
})
