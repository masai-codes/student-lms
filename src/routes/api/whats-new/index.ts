import { createFileRoute } from '@tanstack/react-router'
import { handleGetWhatsNew } from '@/server/api/whats-new/handlers/getWhatsNew.handler'

export const Route = createFileRoute('/api/whats-new/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetWhatsNew(request),
    },
  },
})
