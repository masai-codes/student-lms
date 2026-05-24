import { createFileRoute } from '@tanstack/react-router'

import { handleGetBatchLearningData } from '@/server/api/learn/handlers/getBatchLearningData.handler'

export const Route = createFileRoute('/api/learn/batch-data')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetBatchLearningData(request),
    },
  },
})
