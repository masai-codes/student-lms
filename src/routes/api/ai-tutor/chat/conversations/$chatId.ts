import { createFileRoute } from '@tanstack/react-router'
import { handleGetConversation } from '@/server/api/ai-tutor/handlers/getConversation.handler'

export const Route = createFileRoute('/api/ai-tutor/chat/conversations/$chatId')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetConversation(request, params.chatId),
    },
  },
})
