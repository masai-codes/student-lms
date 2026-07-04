import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardOverview } from '@/server/api/dashboard/handlers/getDashboardOverview.handler'

export const Route = createFileRoute('/api/dashboard/overview')({
  server: {
    handlers: {
      GET: () => handleGetDashboardOverview(),
    },
  },
})
