import { createFileRoute } from '@tanstack/react-router'
import { handleGetClubStats } from '@/server/api/masaiverse-v2/handlers/getClubStats.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/stats')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetClubStats(request),
    },
  },
})
