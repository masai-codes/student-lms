import { createFileRoute } from '@tanstack/react-router'

import { handleGetOpenApiJson } from '@/server/api/docs/handlers/getOpenApiJson.handler'

export const Route = createFileRoute('/api/docs/openapi.json')({
  server: {
    handlers: {
      GET: () => handleGetOpenApiJson(),
    },
  },
})
