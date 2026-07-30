import { createFileRoute } from '@tanstack/react-router'
import { handleGetSupportEntityContext } from '@/server/api/support/handlers/supportEntityContext.handler'

/** GET /api/support/floating-chat/context — batch + item card for detail-page launch. */
export const Route = createFileRoute('/api/support/floating-chat/context')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetSupportEntityContext(request),
    },
  },
})
