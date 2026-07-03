import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardAnnouncements } from '@/server/api/dashboard/handlers/getAnnouncements.handler'

export const Route = createFileRoute('/api/dashboard/announcements')({
  server: {
    handlers: {
      GET: () => handleGetDashboardAnnouncements(),
    },
  },
})
