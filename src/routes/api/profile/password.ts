import { createFileRoute } from '@tanstack/react-router'
import { handleUpdatePassword } from '@/server/api/profile/handlers/updatePassword.handler'

export const Route = createFileRoute('/api/profile/password')({
  server: {
    handlers: {
      PUT: ({ request }) => handleUpdatePassword(request),
    },
  },
})
