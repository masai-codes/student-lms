import { createFileRoute } from '@tanstack/react-router'

import { handleDispatchAiTutorAgent } from '@/server/api/ai-tutor/handlers/dispatchAgent.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/$lectureId/dispatch')(
  {
    server: {
      handlers: {
        POST: ({ request, params }) =>
          handleDispatchAiTutorAgent(request, params.lectureId),
      },
    },
  },
)
