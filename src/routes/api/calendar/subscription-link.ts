import { createFileRoute } from '@tanstack/react-router'
import { handleGetCalendarSubscriptionLink } from '@/server/api/calendar/handlers/getCalendarSubscriptionLink.handler'

export const Route = createFileRoute('/api/calendar/subscription-link')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetCalendarSubscriptionLink(request),
    },
  },
})
