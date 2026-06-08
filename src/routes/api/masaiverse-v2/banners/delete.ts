import { createFileRoute } from '@tanstack/react-router'
import { handleDeleteBanner } from '@/server/api/masaiverse-v2/handlers/deleteBanner.handler'

export const Route = createFileRoute('/api/masaiverse-v2/banners/delete')({
  server: {
    handlers: {
      POST: ({ request }) => handleDeleteBanner(request),
    },
  },
})
