import { createFileRoute } from '@tanstack/react-router'
import { handleGetCalendarBatches } from '@/server/api/calendar/handlers/getCalendarBatches.handler'

export const Route = createFileRoute('/api/calendar/batches')({
  server: {
    handlers: {
      GET: () => handleGetCalendarBatches(),
    },
  },
})
