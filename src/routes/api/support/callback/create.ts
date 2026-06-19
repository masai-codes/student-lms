import { createFileRoute } from '@tanstack/react-router'
import { handleCreateCallback } from '@/server/api/support/handlers/callback.handler'

/** POST /api/support/callback/create — request a callback. */
export const Route = createFileRoute('/api/support/callback/create')({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateCallback(request),
    },
  },
})
