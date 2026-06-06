import { createFileRoute } from '@tanstack/react-router'
import { handleRecordClubVisit } from '@/server/api/masaiverse-v2/handlers/recordClubVisit.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/visit')({
  server: {
    handlers: {
      POST: ({ request }) => handleRecordClubVisit(request),
    },
  },
})
