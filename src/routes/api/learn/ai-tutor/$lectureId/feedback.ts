import { createFileRoute } from '@tanstack/react-router'

import { handleSubmitFeedback } from '@/server/api/ai-tutor/handlers/submitFeedback.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/$lectureId/feedback')({
  server: {
    handlers: {
      POST: ({ request }) => handleSubmitFeedback(request),
    },
  },
})
