import { createFileRoute } from '@tanstack/react-router'

import {
  handleAddResourceBookmark,
  handleRemoveResourceBookmark,
} from '@/server/api/learn/handlers/resourceBookmark.handler'

export const Route = createFileRoute('/api/learn/resources/$resourceId/bookmark')({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleAddResourceBookmark(request, params.resourceId),
      DELETE: ({ request, params }) =>
        handleRemoveResourceBookmark(request, params.resourceId),
    },
  },
})
