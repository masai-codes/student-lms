import { createFileRoute } from '@tanstack/react-router'
import { handleGetSupportOverview } from '@/server/api/support/handlers/overview.handler'

/** GET /api/support/overview — the single aggregated landing payload. */
export const Route = createFileRoute('/api/support/overview')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetSupportOverview(request),
    },
  },
})
