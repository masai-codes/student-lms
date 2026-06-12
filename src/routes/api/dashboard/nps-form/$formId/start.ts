import { createFileRoute } from '@tanstack/react-router'
import { handleCreateNpsSubmission } from '@/server/api/dashboard/handlers/createNpsSubmission.handler'

export const Route = createFileRoute('/api/dashboard/nps-form/$formId/start')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleCreateNpsSubmission(request, params.formId),
    },
  },
})
