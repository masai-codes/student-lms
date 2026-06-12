import { createFileRoute } from '@tanstack/react-router'
import { handleSubmitNpsResponse } from '@/server/api/dashboard/handlers/submitNpsResponse.handler'

export const Route = createFileRoute('/api/dashboard/nps-form/$formId/response')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleSubmitNpsResponse(request, params.formId),
    },
  },
})
