import { createFileRoute } from '@tanstack/react-router'

import { handleFullPaymentReceived } from '@/server/api/webhooks/admissions/handlers/fullPaymentReceived.handler'

export const Route = createFileRoute(
  '/api/webhooks/admissions/batch-full-payment-received',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleFullPaymentReceived(request),
    },
  },
})
