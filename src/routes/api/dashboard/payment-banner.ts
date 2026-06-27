import { createFileRoute } from '@tanstack/react-router'
import { handleGetPaymentBannerInfo } from '@/server/api/dashboard/handlers/getPaymentBannerInfo.handler'

export const Route = createFileRoute('/api/dashboard/payment-banner')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetPaymentBannerInfo(request),
    },
  },
})
