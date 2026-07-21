import { createFileRoute } from '@tanstack/react-router'

import { handleSendAiChatMessage } from '@/server/api/ai-chat/handlers/sendMessage.handler'

export const Route = createFileRoute('/api/learn/ai-chat/$lectureId/send')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleSendAiChatMessage(request, params.lectureId),
    },
  },
})
