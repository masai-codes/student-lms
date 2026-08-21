import { createFileRoute } from '@tanstack/react-router'
import {
  handleGetSessions,
  handleRemoveOtherSessions,
} from '@/server/api/profile/handlers/sessions.handler'

export const Route = createFileRoute('/api/profile/sessions/')({
  server: {
    handlers: {
      GET: () => handleGetSessions(),
      DELETE: () => handleRemoveOtherSessions(),
    },
  },
})
