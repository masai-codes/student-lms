import { createFileRoute } from '@tanstack/react-router'
import { handleGetCertificates } from '@/server/api/profile/handlers/certificates.handler'

export const Route = createFileRoute('/api/profile/certificates/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetCertificates(request),
    },
  },
})
