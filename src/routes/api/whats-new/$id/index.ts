import { createFileRoute } from '@tanstack/react-router'
import { handleGetWhatsNewById } from '@/server/api/whats-new/handlers/getWhatsNewById.handler'

export const Route = createFileRoute('/api/whats-new/$id/')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGetWhatsNewById(request, params.id),
    },
  },
})
