import { createFileRoute } from '@tanstack/react-router'
import { handleGetAnnouncementById } from '@/server/api/announcement/handlers/getAnnouncementById.handler'

export const Route = createFileRoute('/api/message/$id/')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetAnnouncementById(request, params.id, 'm'),
    },
  },
})
