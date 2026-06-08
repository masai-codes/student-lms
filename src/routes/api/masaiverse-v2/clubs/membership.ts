import { createFileRoute } from '@tanstack/react-router'
import { handleSetClubMembership } from '@/server/api/masaiverse-v2/handlers/setClubMembership.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/membership')({
  server: {
    handlers: {
      POST: ({ request }) => handleSetClubMembership(request),
    },
  },
})
