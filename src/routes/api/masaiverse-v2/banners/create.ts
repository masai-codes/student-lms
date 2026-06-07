import { createFileRoute } from '@tanstack/react-router'
import { handleCreateBanner } from '@/server/api/masaiverse-v2/handlers/createBanner.handler'

export const Route = createFileRoute('/api/masaiverse-v2/banners/create')({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateBanner(request),
    },
  },
})
