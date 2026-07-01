import { createFileRoute } from '@tanstack/react-router'
import { handlePresignUpload } from '@/server/api/uploads/handlers/presign.handler'

/** POST /api/uploads/presign — presigned POST policy for direct S3 uploads. */
export const Route = createFileRoute('/api/uploads/presign')({
  server: {
    handlers: {
      POST: ({ request }) => handlePresignUpload(request),
    },
  },
})
