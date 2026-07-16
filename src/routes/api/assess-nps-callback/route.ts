import { createFileRoute } from '@tanstack/react-router'
import { handleAssessNpsCallbackRequest } from '@/server/api/dashboard/handlers/assessNpsCallback.handler'

export const Route = createFileRoute('/api/assess-nps-callback')({
  server: {
    handlers: {
      POST: ({ request }) => handleAssessNpsCallbackRequest(request),
    },
  },
})
