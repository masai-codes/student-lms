import { createFileRoute } from '@tanstack/react-router'
import { handleUploadAttachment } from '@/server/api/support/handlers/upload.handler'

/** POST /api/support/upload — upload a ticket attachment, returns { url, name }. */
export const Route = createFileRoute('/api/support/upload')({
  server: {
    handlers: {
      POST: ({ request }) => handleUploadAttachment(request),
    },
  },
})
