import { createFileRoute } from '@tanstack/react-router'
import { handleSaveAgreementDetails } from '@/server/api/dashboard/handlers/saveAgreementDetails.handler'

export const Route = createFileRoute('/api/dashboard/agreement/$sectionId/details')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleSaveAgreementDetails(request, params.sectionId),
    },
  },
})
