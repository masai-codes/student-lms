import { createFileRoute } from '@tanstack/react-router'
import { handleGetLectureSupportSnapshot } from '@/server/api/support/handlers/lectureSupportSnapshot.handler'

/** GET /api/support/floating-chat/lectures/:lectureId — lecture snapshot for support modal. */
export const Route = createFileRoute('/api/support/floating-chat/lectures/$lectureId')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetLectureSupportSnapshot(request, params.lectureId),
    },
  },
})
