import { createFileRoute } from '@tanstack/react-router'
import { handleGetMasaiverseV2Home } from '@/server/api/masaiverse-v2/handlers/getMasaiverseV2Home.handler'

export const Route = createFileRoute('/api/masaiverse-v2/home')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetMasaiverseV2Home(request),
    },
  },
})
