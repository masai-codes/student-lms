import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardPendingTasks } from '@/server/api/dashboard/handlers/getDashboardPendingTasks.handler'

export const Route = createFileRoute('/api/dashboard/pending-tasks')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetDashboardPendingTasks(request),
    },
  },
})
