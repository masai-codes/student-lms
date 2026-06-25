import { createFileRoute } from '@tanstack/react-router'
import { handleSecretLogin } from '@/server/auth/secretLogin'

export const Route = createFileRoute('/api/secret-login')({
  server: {
    handlers: {
      GET: ({ request }) => handleSecretLogin(request),
    },
  },
})
