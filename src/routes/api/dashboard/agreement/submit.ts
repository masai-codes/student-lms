import { createFileRoute } from '@tanstack/react-router'
import { handleSubmitAgreement } from '@/server/api/dashboard/handlers/submitAgreement.handler'

export const Route = createFileRoute('/api/dashboard/agreement/submit')({
  server: {
    handlers: {
      POST: ({ request }) => handleSubmitAgreement(request),
    },
  },
})
