import { createFileRoute } from '@tanstack/react-router'
import { handleAcceptUndertaking } from '@/server/api/profile/handlers/undertakings.handler'

export const Route = createFileRoute(
  '/api/profile/undertakings/$sectionId/accept',
)({
  server: {
    handlers: {
      POST: ({ params, request }) =>
        handleAcceptUndertaking(Number(params.sectionId), request),
    },
  },
})
