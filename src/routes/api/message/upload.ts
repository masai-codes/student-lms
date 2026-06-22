import { createFileRoute } from '@tanstack/react-router'
import { handleUploadMessageAttachment } from '@/server/api/announcement/handlers/uploadMessageAttachment.handler'

export const Route = createFileRoute('/api/message/upload')({
  server: {
    handlers: {
      POST: ({ request }) => handleUploadMessageAttachment(request),
    },
  },
})
