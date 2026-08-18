import { createFileRoute } from '@tanstack/react-router'
import { handleGetUndertakings } from '@/server/api/profile/handlers/undertakings.handler'

export const Route = createFileRoute('/api/profile/undertakings/')({
  server: {
    handlers: {
      GET: () => handleGetUndertakings(),
    },
  },
})
