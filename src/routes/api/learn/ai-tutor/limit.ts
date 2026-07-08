import { createFileRoute } from '@tanstack/react-router'

import { handleGetAiTutorLimit } from '@/server/api/ai-tutor/handlers/getLimit.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/limit')({
  server: {
    handlers: {
      GET: () => handleGetAiTutorLimit(),
    },
  },
})
