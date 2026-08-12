import { createFileRoute } from '@tanstack/react-router'

import {
  handleGetMasaiLiveLogin,
  handlePostMasaiLiveLogin,
} from '@/server/api/user-auth/handlers/masaiLiveLogin.handler'

export const Route = createFileRoute('/api/user-auth/masai-live-login')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetMasaiLiveLogin(request),
      POST: ({ request }) => handlePostMasaiLiveLogin(request),
    },
  },
})
