import { createFileRoute } from '@tanstack/react-router'
import { handleGetAdminMode } from '@/server/api/masaiverse-v2/handlers/getAdminMode.handler'
import { handleSetAdminMode } from '@/server/api/masaiverse-v2/handlers/setAdminMode.handler'

export const Route = createFileRoute('/api/masaiverse-v2/admin-mode')({
  server: {
    handlers: {
      GET: () => handleGetAdminMode(),
      POST: ({ request }) => handleSetAdminMode(request),
    },
  },
})
