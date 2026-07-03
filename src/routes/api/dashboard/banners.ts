import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardBanners } from '@/server/api/dashboard/handlers/getDashboardBanners.handler'

export const Route = createFileRoute('/api/dashboard/banners')({
  server: {
    handlers: {
      GET: () => handleGetDashboardBanners(),
    },
  },
})
