import { createFileRoute } from '@tanstack/react-router'

import { handleBatchTransferRejected } from '@/server/api/webhooks/admissions/handlers/batchTransfer.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/batch-transfer-request-rejected',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleBatchTransferRejected(request),
    },
  },
})
