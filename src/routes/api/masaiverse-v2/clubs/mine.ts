import { createFileRoute } from '@tanstack/react-router'
import { handleGetMyClubs } from '@/server/api/masaiverse-v2/handlers/getMyClubs.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/mine')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetMyClubs(request),
    },
  },
})
