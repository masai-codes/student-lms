import { createFileRoute } from '@tanstack/react-router'
import { handleGetCourseBatchData } from '@/server/api/course/handlers/getCourseBatchData.handler'

export const Route = createFileRoute('/api/course/$batchId/')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCourseBatchData(Number(params.batchId)),
    },
  },
})
