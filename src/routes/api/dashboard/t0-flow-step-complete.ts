import { createFileRoute } from '@tanstack/react-router'
import { handleRecordGuidedTourStepCompleted } from '@/server/api/dashboard/handlers/recordGuidedTourStepCompleted.handler'

export const Route = createFileRoute('/api/dashboard/t0-flow-step-complete')({
  server: {
    handlers: {
      POST: ({ request }) => handleRecordGuidedTourStepCompleted(request),
    },
  },
})
