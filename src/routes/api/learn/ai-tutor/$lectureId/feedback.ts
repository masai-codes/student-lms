import { createFileRoute } from '@tanstack/react-router'

import { handleSubmitAiTutorFeedback } from '@/server/api/ai-tutor/handlers/submitFeedback.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/$lectureId/feedback')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSubmitAiTutorFeedback(request, params.lectureId),
    },
  },
})
