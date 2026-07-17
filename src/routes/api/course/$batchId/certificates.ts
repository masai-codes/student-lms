import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseCertificates } from '@/server/api/course/handlers/getCourseCertificates.handler'

export const Route = createFileRoute('/api/course/$batchId/certificates')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCourseCertificates(Number(params.batchId)),
    },
  },
})
