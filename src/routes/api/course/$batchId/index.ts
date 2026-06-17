import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseBatchData } from '@/server/api/course/handlers/getCourseBatchData.handler'

export const Route = createFileRoute('/api/course/$batchId/')({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGetCourseBatchData(request, Number(params.batchId)),
    },
  },
})
