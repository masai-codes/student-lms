import { createFileRoute } from '@tanstack/react-router'
import { handleGetGlobalLeaderboard } from '@/server/api/masaiverse-v2/handlers/getGlobalLeaderboard.handler'

export const Route = createFileRoute('/api/masaiverse-v2/leaderboard')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetGlobalLeaderboard(request),
    },
  },
})
