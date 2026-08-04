import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardOverviewApp } from '@/server/api/dashboard/handlers/getDashboardOverviewApp.handler'

export const Route = createFileRoute('/api/dashboard/overview-app')({
  server: {
    handlers: {
      GET: () => handleGetDashboardOverviewApp(),
    },
  },
})
