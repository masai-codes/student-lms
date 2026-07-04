import { createFileRoute } from '@tanstack/react-router'

import { handleGetZoomRedirect } from '@/server/api/learn/handlers/zoomRedirect.handler'

export const Route = createFileRoute(
  '/api/learn/lectures/$lectureId/zoom-redirect',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleGetZoomRedirect(params.lectureId),
    },
  },
})
