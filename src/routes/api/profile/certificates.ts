import { createFileRoute } from '@tanstack/react-router'
import { handleGetProfileCertificates } from '@/server/api/profile/handlers/profileTabs.handler'

export const Route = createFileRoute('/api/profile/certificates')({
  server: {
    handlers: {
      GET: () => handleGetProfileCertificates(),
    },
  },
})
