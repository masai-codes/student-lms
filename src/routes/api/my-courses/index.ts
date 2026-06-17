import { createFileRoute } from '@tanstack/react-router'
import { handleGetMyCourses } from '@/server/api/my-courses/handlers/getMyCourses.handler'

export const Route = createFileRoute('/api/my-courses/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetMyCourses(request),
    },
  },
})
