import { createFileRoute } from '@tanstack/react-router'
import { handleCreateClub } from '@/server/api/masaiverse-v2/handlers/createClub.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/create')({
  server: {
    handlers: {
      POST: () => handleCreateClub(),
    },
  },
})
