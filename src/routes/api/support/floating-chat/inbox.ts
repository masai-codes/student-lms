import { createFileRoute } from '@tanstack/react-router'
import { handleGetFloatingChatInbox } from '@/server/api/support/handlers/floatingChatInbox.handler'

/** GET /api/support/floating-chat/inbox — floating support modal inbox payload. */
export const Route = createFileRoute('/api/support/floating-chat/inbox')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetFloatingChatInbox(request),
    },
  },
})
