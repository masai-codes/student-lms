import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardActionBanners } from '@/server/api/dashboard/handlers/getDashboardActionBanners.handler'

export const Route = createFileRoute('/api/dashboard/action-banners')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetDashboardActionBanners(request),
    },
  },
})
