import { createFileRoute } from '@tanstack/react-router'
import { handleGetT0FlowLectures } from '@/server/api/dashboard/handlers/getT0FlowLectures.handler'

export const Route = createFileRoute('/api/dashboard/t0-flow-lectures')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetT0FlowLectures(request),
    },
  },
})
