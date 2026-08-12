import { createFileRoute } from '@tanstack/react-router'

import { handleGetDocsUi } from '@/server/api/docs/handlers/getDocsUi.handler'

export const Route = createFileRoute('/api/docs/')({
  server: {
    handlers: {
      GET: () => handleGetDocsUi(),
    },
  },
})
