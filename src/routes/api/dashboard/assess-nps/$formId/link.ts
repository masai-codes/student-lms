import { createFileRoute } from '@tanstack/react-router'
import { handleGetAssessLink } from '@/server/api/dashboard/handlers/getAssessLink.handler'

export const Route = createFileRoute('/api/dashboard/assess-nps/$formId/link')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGetAssessLink(request, params.formId),
    },
  },
})
