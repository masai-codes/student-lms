import { createFileRoute } from '@tanstack/react-router'
import { handleGetAchievements } from '@/server/api/profile/handlers/profileTabs.handler'

export const Route = createFileRoute('/api/profile/achievements')({
  server: {
    handlers: {
      GET: () => handleGetAchievements(),
    },
  },
})
