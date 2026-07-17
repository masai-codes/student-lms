import { createFileRoute } from '@tanstack/react-router'
import { handleSubmitFeedback } from '@/server/api/ai-tutor/handlers/submitFeedback.handler'

export const Route = createFileRoute('/api/ai-tutor/chat/feedback')({
  server: {
    handlers: {
      POST: ({ request }) => handleSubmitFeedback(request),
    },
  },
})
