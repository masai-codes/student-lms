import { createFileRoute } from '@tanstack/react-router'
import { handleGetDashboardRightSection } from '@/server/api/dashboard/handlers/getDashboardRightSection.handler'

export const Route = createFileRoute('/api/dashboard/right-section')({
  server: {
    handlers: {
      GET: () => handleGetDashboardRightSection(),
    },
  },
})
