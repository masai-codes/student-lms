import { createFileRoute } from '@tanstack/react-router'
import { handleMarkAnnouncementRead } from '@/server/api/announcement/handlers/markAnnouncementRead.handler'

export const Route = createFileRoute('/api/announcement/$id/mark-read')({
  server: {
    handlers: {
      POST: ({ params }) => handleMarkAnnouncementRead(params.id, 'a'),
    },
  },
})
