import { createFileRoute } from '@tanstack/react-router'

import { handleEndAiTutorSession } from '@/server/api/ai-tutor/handlers/endSession.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/end')({
  server: {
    handlers: {
      POST: ({ request }) => handleEndAiTutorSession(request),
    },
  },
})
