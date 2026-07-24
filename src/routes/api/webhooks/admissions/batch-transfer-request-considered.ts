import { createFileRoute } from '@tanstack/react-router'

import { handleBatchTransferConsidered } from '@/server/api/webhooks/admissions/handlers/batchTransfer.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/batch-transfer-request-considered',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleBatchTransferConsidered(request),
    },
  },
})
