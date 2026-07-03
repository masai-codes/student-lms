import { createFileRoute } from '@tanstack/react-router'
import { handleGetWelcomeModalStatus } from '@/server/api/dashboard/handlers/getWelcomeModalStatus.handler'

export const Route = createFileRoute('/api/dashboard/welcome-modal-status')({
  server: {
    handlers: {
      GET: () => handleGetWelcomeModalStatus(),
    },
  },
})
