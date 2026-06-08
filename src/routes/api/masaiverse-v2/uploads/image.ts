import { createFileRoute } from '@tanstack/react-router'
import { handleUploadImage } from '@/server/api/masaiverse-v2/handlers/uploadImage.handler'

export const Route = createFileRoute('/api/masaiverse-v2/uploads/image')({
  server: {
    handlers: {
      POST: ({ request }) => handleUploadImage(request),
    },
  },
})
