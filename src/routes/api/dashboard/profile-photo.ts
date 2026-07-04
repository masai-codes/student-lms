import { createFileRoute } from '@tanstack/react-router'
import { handleUploadProfilePhoto } from '@/server/api/dashboard/handlers/uploadProfilePhoto.handler'

export const Route = createFileRoute('/api/dashboard/profile-photo')({
  server: {
    handlers: {
      POST: ({ request }) => handleUploadProfilePhoto(request),
    },
  },
})
