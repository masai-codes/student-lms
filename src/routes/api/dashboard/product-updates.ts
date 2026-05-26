import { createFileRoute } from '@tanstack/react-router'
import { handleGetProductUpdates } from '@/server/api/dashboard/handlers/getProductUpdates.handler'

export const Route = createFileRoute('/api/dashboard/product-updates')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetProductUpdates(request),
    },
  },
})
