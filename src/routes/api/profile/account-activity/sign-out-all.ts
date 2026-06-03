import { createFileRoute } from '@tanstack/react-router'
import { handleDeleteAllSessions } from '@/server/api/profile/handlers/accountActivity.handler'

export const Route = createFileRoute('/api/profile/account-activity/sign-out-all')({
  server: {
    handlers: {
      POST: ({ request }) => handleDeleteAllSessions(request),
    },
  },
})
