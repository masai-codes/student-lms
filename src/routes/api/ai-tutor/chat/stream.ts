import { createFileRoute } from '@tanstack/react-router'
import { handleStreamChat } from '@/server/api/ai-tutor/handlers/streamChat.handler'

export const Route = createFileRoute('/api/ai-tutor/chat/stream')({
  server: {
    handlers: {
      POST: ({ request }) => handleStreamChat(request),
    },
  },
})
