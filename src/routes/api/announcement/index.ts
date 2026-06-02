import { createFileRoute } from '@tanstack/react-router'
import { handleGetAnnouncements } from '@/server/api/announcement/handlers/getAnnouncements.handler'

export const Route = createFileRoute('/api/announcement/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetAnnouncements(request),
    },
  },
})
