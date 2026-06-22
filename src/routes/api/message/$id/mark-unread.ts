import { createFileRoute } from '@tanstack/react-router'
import { handleMarkAnnouncementUnread } from '@/server/api/announcement/handlers/markAnnouncementUnread.handler'

export const Route = createFileRoute('/api/message/$id/mark-unread')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleMarkAnnouncementUnread(request, params.id, 'm'),
    },
  },
})
