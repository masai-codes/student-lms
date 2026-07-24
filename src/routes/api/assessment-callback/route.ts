import { createFileRoute } from '@tanstack/react-router'
import { handleAssessmentCallback } from '@/server/api/learn/handlers/assessmentCallback.handler'

export const Route = createFileRoute('/api/assessment-callback')({
  server: {
    handlers: {
      POST: ({ request }) => handleAssessmentCallback(request),
    },
  },
})
