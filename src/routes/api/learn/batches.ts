import { createFileRoute } from '@tanstack/react-router'

import { handleGetEnrolledBatches } from '@/server/api/learn/handlers/getEnrolledBatches.handler'

export const Route = createFileRoute('/api/learn/batches')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetEnrolledBatches(request),
    },
  },
})
