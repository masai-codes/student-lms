import { createFileRoute } from '@tanstack/react-router'
import { handleGetClubEditData } from '@/server/api/masaiverse-v2/handlers/getClubEditData.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/edit-data')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetClubEditData(request),
    },
  },
})
