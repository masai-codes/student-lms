import { createFileRoute } from '@tanstack/react-router'
import { handleGetPhotoPresignedUrl } from '@/server/api/profile/handlers/getPhotoPresignedUrl.handler'

export const Route = createFileRoute('/api/profile/photo-upload-url')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetPhotoPresignedUrl(request),
    },
  },
})
