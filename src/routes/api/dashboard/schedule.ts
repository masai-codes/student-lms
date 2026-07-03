import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardSchedule } from '@/server/api/dashboard/handlers/getDashboardSchedule.handler'

export const Route = createFileRoute('/api/dashboard/schedule')({
  server: {
    handlers: {
      GET: () => handleGetDashboardSchedule(),
    },
  },
})
