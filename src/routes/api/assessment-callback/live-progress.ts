import { createFileRoute } from '@tanstack/react-router'
import { handleAssessmentLiveProgressCallback } from '@/server/api/learn/handlers/assessmentLiveProgressCallback.handler'

export const Route = createFileRoute('/api/assessment-callback/live-progress')({
  server: {
    handlers: {
      POST: ({ request }) => handleAssessmentLiveProgressCallback(request),
    },
  },
})
