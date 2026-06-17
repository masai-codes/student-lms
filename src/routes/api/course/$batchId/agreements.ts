import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseAgreements } from '@/server/api/course/handlers/getCourseAgreements.handler'

export const Route = createFileRoute('/api/course/$batchId/agreements')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGetCourseAgreements(request, Number(params.batchId)),
    },
  },
})
