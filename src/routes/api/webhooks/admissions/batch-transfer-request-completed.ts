import { createFileRoute } from '@tanstack/react-router'

import { handleBatchTransferCompleted } from '@/server/api/webhooks/admissions/handlers/batchTransfer.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/batch-transfer-request-completed',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleBatchTransferCompleted(request),
    },
  },
})
