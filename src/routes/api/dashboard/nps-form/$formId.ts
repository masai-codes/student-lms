import { createFileRoute } from '@tanstack/react-router'
import { handleGetNpsForm } from '@/server/api/dashboard/handlers/getNpsForm.handler'
import { handleSubmitNpsForm } from '@/server/api/dashboard/handlers/submitNpsForm.handler'

export const Route = createFileRoute('/api/dashboard/nps-form/$formId')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetNpsForm(params.formId),
      POST: ({ request, params }) =>
        handleSubmitNpsForm(request, params.formId),
    },
  },
})
