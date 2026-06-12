import { createFileRoute } from '@tanstack/react-router'
import { handleRecordAgreementStep } from '@/server/api/dashboard/handlers/recordAgreementStep.handler'

export const Route = createFileRoute('/api/dashboard/agreement/$sectionId/step')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleRecordAgreementStep(request, params.sectionId),
    },
  },
})
