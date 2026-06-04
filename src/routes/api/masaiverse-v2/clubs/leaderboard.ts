import { createFileRoute } from '@tanstack/react-router'
import { handleGetClubLeaderboard } from '@/server/api/masaiverse-v2/handlers/getClubLeaderboard.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/leaderboard')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetClubLeaderboard(request),
    },
  },
})
