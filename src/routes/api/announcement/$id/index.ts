import { createFileRoute } from '@tanstack/react-router'
import { handleGetAnnouncementById } from '@/server/api/announcement/handlers/getAnnouncementById.handler'

export const Route = createFileRoute('/api/announcement/$id/')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetAnnouncementById(params.id, 'a'),
    },
  },
})
