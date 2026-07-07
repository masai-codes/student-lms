import { createFileRoute } from '@tanstack/react-router'
import { handleSaveAgreementDetails } from '@/server/api/dashboard/handlers/saveAgreementDetails.handler'

export const Route = createFileRoute('/api/dashboard/agreement/save')({
  server: {
    handlers: {
      POST: ({ request }) => handleSaveAgreementDetails(request),
    },
  },
})
