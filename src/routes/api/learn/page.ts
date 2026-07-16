import { createFileRoute } from '@tanstack/react-router'

import { handleGetLearnPageData } from '@/server/api/learn/handlers/getLearnPageData.handler'

export const Route = createFileRoute('/api/learn/page')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetLearnPageData(request),
    },
  },
})
