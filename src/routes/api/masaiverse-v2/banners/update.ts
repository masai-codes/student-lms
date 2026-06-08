import { createFileRoute } from '@tanstack/react-router'
import { handleUpdateBanner } from '@/server/api/masaiverse-v2/handlers/updateBanner.handler'

export const Route = createFileRoute('/api/masaiverse-v2/banners/update')({
  server: {
    handlers: {
      POST: ({ request }) => handleUpdateBanner(request),
    },
  },
})
