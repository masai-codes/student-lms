import { createFileRoute } from '@tanstack/react-router'
import { handleCompleteNpsSubmission } from '@/server/api/dashboard/handlers/completeNpsSubmission.handler'

export const Route = createFileRoute('/api/dashboard/nps-form/$formId/complete')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleCompleteNpsSubmission(request, params.formId),
    },
  },
})
