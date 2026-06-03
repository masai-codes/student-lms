import { createFileRoute } from '@tanstack/react-router'
import { handleGetEmailPreferences, handleUpdateEmailPreferences } from '@/server/api/profile/handlers/emailPreferences.handler'

export const Route = createFileRoute('/api/profile/email-preferences/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetEmailPreferences(request),
      PATCH: ({ request }) => handleUpdateEmailPreferences(request),
    },
  },
})
