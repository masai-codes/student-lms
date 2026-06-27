import { createFileRoute } from '@tanstack/react-router'
import { handleDismissWelcomeModal } from '@/server/api/dashboard/handlers/dismissWelcomeModal.handler'

export const Route = createFileRoute('/api/dashboard/welcome-modal-dismiss')({
  server: {
    handlers: {
      POST: ({ request }) => handleDismissWelcomeModal(request),
    },
  },
})
