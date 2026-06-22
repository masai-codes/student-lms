import { createFileRoute } from '@tanstack/react-router'
import { handleGetAnnouncementPopups } from '@/server/api/announcement/handlers/getAnnouncementPopups.handler'

export const Route = createFileRoute('/api/announcement/popups')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetAnnouncementPopups(request),
    },
  },
})
