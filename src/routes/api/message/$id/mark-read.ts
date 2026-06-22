import { createFileRoute } from '@tanstack/react-router'
import { handleMarkAnnouncementRead } from '@/server/api/announcement/handlers/markAnnouncementRead.handler'

export const Route = createFileRoute('/api/message/$id/mark-read')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleMarkAnnouncementRead(request, params.id, 'm'),
    },
  },
})
