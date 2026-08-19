import { createFileRoute } from '@tanstack/react-router'
import { handleGetCalendarEvents } from '@/server/api/calendar/handlers/getCalendarEvents.handler'

export const Route = createFileRoute('/api/calendar/events')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetCalendarEvents(request),
    },
  },
})
