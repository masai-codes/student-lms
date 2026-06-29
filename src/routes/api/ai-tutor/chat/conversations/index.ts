import { createFileRoute } from '@tanstack/react-router'
import { handleListConversations } from '@/server/api/ai-tutor/handlers/listConversations.handler'

export const Route = createFileRoute('/api/ai-tutor/chat/conversations/')({
  server: {
    handlers: {
      GET: ({ request }) => handleListConversations(request),
    },
  },
})
