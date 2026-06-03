import { createFileRoute } from '@tanstack/react-router'
import {
  handleDeleteSession,
  handleGetSessions
} from '@/server/api/profile/handlers/accountActivity.handler'

export const Route = createFileRoute('/api/profile/account-activity/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetSessions(request),
      DELETE: ({ request }) => handleDeleteSession(request),
    },
  },
})
