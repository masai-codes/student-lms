import { createFileRoute } from '@tanstack/react-router'
import { handleGetAchievements } from '@/server/api/profile/handlers/getAchievements.handler'

export const Route = createFileRoute('/api/profile/achievements')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetAchievements(request),
    },
  },
})
