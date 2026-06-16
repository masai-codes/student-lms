import { createFileRoute } from '@tanstack/react-router'
import { handleSaveProfilePic } from '@/server/api/profile/handlers/saveProfilePic.handler'

export const Route = createFileRoute('/api/profile/photo')({
  server: {
    handlers: {
      POST: ({ request }) => handleSaveProfilePic(request),
    },
  },
})
