import { createFileRoute } from '@tanstack/react-router'
import { handleGetT0FlowStatus } from '@/server/api/dashboard/handlers/getT0FlowStatus.handler'

export const Route = createFileRoute('/api/dashboard/t0-flow-status')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetT0FlowStatus(request),
    },
  },
})
