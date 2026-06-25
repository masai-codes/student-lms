import { createFileRoute } from '@tanstack/react-router'
import { handleGetT0FlowStudentStatus } from '@/server/api/dashboard/handlers/getT0FlowStudentStatus.handler'

export const Route = createFileRoute('/api/dashboard/t0-flow-student-status')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetT0FlowStudentStatus(request),
    },
  },
})
