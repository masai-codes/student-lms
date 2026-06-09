import { createFileRoute } from '@tanstack/react-router'
import { handleSearchUsers } from '@/server/api/masaiverse-v2/handlers/searchUsers.handler'

export const Route = createFileRoute('/api/masaiverse-v2/users/search')({
  server: {
    handlers: {
      GET: ({ request }) => handleSearchUsers(request),
    },
  },
})
