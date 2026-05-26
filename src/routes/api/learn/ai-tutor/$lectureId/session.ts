import { createFileRoute } from '@tanstack/react-router'

import { handleCreateAiTutorSession } from '@/server/api/ai-tutor/handlers/createSession.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/$lectureId/session')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleCreateAiTutorSession(request, params.lectureId),
    },
  },
})
