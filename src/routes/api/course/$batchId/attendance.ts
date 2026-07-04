import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseAttendance } from '@/server/api/course/handlers/getCourseAttendance.handler'

export const Route = createFileRoute('/api/course/$batchId/attendance')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCourseAttendance(Number(params.batchId)),
    },
  },
})
