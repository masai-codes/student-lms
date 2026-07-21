import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseDetails } from '@/server/api/course/handlers/getCourseDetails.handler'

export const Route = createFileRoute('/api/course/$batchId/details')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCourseDetails(Number(params.batchId)),
    },
  },
})
