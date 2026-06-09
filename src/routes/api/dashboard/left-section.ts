import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardLeftSection } from '@/server/api/dashboard/handlers/getDashboardLeftSection.handler'

export const Route = createFileRoute('/api/dashboard/left-section')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetDashboardLeftSection(request),
    },
  },
})
