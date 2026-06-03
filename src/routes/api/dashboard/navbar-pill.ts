import { createFileRoute } from '@tanstack/react-router'
import { handleGetNavbarPill } from '@/server/api/dashboard/handlers/getNavbarPill.handler'

export const Route = createFileRoute('/api/dashboard/navbar-pill')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetNavbarPill(request),
    },
  },
})
