import { createFileRoute } from '@tanstack/react-router'
import { handleSendMessageReply } from '@/server/api/announcement/handlers/sendMessageReply.handler'

export const Route = createFileRoute('/api/message/$id/reply')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleSendMessageReply(request, params.id),
    },
  },
})
