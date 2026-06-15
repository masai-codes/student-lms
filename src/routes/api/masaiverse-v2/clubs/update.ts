import { createFileRoute } from '@tanstack/react-router'
import { handleUpdateClub } from '@/server/api/masaiverse-v2/handlers/updateClub.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/update')({
  server: {
    handlers: {
      POST: ({ request }) => handleUpdateClub(request),
    },
  },
})
