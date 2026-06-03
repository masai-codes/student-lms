import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardAttendance } from '@/server/api/dashboard/handlers/getDashboardAttendance.handler'

export const Route = createFileRoute('/api/dashboard/attendance')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetDashboardAttendance(request),
    },
  },
})
