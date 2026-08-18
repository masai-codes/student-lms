import { createFileRoute } from '@tanstack/react-router'
import { handleGetCalendarFeed } from '@/server/api/calendar/handlers/getCalendarFeed.handler'

export const Route = createFileRoute('/api/calendar/feed/$token')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCalendarFeed(params.token),
    },
  },
})
