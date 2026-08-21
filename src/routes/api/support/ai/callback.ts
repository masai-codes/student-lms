import { createFileRoute } from '@tanstack/react-router'
import { handleAiTicketCallback } from '@/server/api/support/handlers/aiTicketCallback.handler'

/** POST /api/support/ai/callback — AI ticket-resolution agent webhook. */
export const Route = createFileRoute('/api/support/ai/callback')({
  server: {
    handlers: {
      POST: ({ request }) => handleAiTicketCallback(request),
    },
  },
})
