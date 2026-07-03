import { createFileRoute } from '@tanstack/react-router'
import { handleGetBanners } from '@/server/api/masaiverse-v2/handlers/getBanners.handler'

export const Route = createFileRoute('/api/masaiverse-v2/banners/list')({
  server: {
    handlers: {
      GET: () => handleGetBanners(),
    },
  },
})
