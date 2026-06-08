import { createFileRoute } from '@tanstack/react-router'
import { handleGetClubDetail } from '@/server/api/masaiverse-v2/handlers/getClubDetail.handler'

export const Route = createFileRoute('/api/masaiverse-v2/clubs/detail')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetClubDetail(request),
    },
  },
})
