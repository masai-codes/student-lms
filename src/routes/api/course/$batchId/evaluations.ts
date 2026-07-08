import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseEvaluations } from '@/server/api/course/handlers/getCourseEvaluations.handler'

export const Route = createFileRoute('/api/course/$batchId/evaluations')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCourseEvaluations(Number(params.batchId)),
    },
  },
})
