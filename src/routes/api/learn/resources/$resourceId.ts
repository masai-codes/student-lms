import { createFileRoute } from '@tanstack/react-router'

import { handleGetResourceLearningDetail } from '@/server/api/learn/handlers/getResourceLearningDetail.handler'

export const Route = createFileRoute('/api/learn/resources/$resourceId')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetResourceLearningDetail(params.resourceId),
    },
  },
})
