import { createFileRoute } from '@tanstack/react-router'
import { handleMarkTryNewTourSeen } from '@/server/api/profile/handlers/newLmsPreference.handler'

export const Route = createFileRoute('/api/profile/try-new-tour')({
  server: {
    handlers: {
      POST: () => handleMarkTryNewTourSeen(),
    },
  },
})
