import { createFileRoute } from '@tanstack/react-router'
import { handleGetAnnouncementUnreadCount } from '@/server/api/announcement/handlers/getAnnouncementUnreadCount.handler'

export const Route = createFileRoute('/api/announcement/unread-count')({
  server: {
    handlers: {
      GET: () => handleGetAnnouncementUnreadCount(),
    },
  },
})
