import { createFileRoute } from '@tanstack/react-router'
import { handleGetMyCourses } from '@/server/api/courses/handlers/getMyCourses.handler'

export const Route = createFileRoute('/api/courses/')({
  server: {
    handlers: {
      GET: () => handleGetMyCourses(),
    },
  },
})
