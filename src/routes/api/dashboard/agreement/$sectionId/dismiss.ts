import { createFileRoute } from '@tanstack/react-router'
import { handleDismissAgreement } from '@/server/api/dashboard/handlers/dismissAgreement.handler'

export const Route = createFileRoute('/api/dashboard/agreement/$sectionId/dismiss')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleDismissAgreement(request, params.sectionId),
    },
  },
})
