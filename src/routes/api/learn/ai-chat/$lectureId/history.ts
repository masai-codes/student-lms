import { createFileRoute } from '@tanstack/react-router'

import { handleGetAiChatHistory } from '@/server/api/ai-chat/handlers/getHistory.handler'

export const Route = createFileRoute('/api/learn/ai-chat/$lectureId/history')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetAiChatHistory(params.lectureId),
    },
  },
})
