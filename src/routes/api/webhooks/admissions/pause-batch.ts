import { createFileRoute } from '@tanstack/react-router'

import { handlePauseBatch } from '@/server/api/webhooks/admissions/handlers/pauseBatch.handler'

export const Route = createFileRoute('/api/webhooks/admissions/pause-batch')({
  server: {
    handlers: {
      POST: ({ request }) => handlePauseBatch(request),
    },
  },
})
