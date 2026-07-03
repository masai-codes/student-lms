import { createFileRoute } from '@tanstack/react-router'

import {
  handleAddResourceBookmark,
  handleRemoveResourceBookmark,
} from '@/server/api/learn/handlers/resourceBookmark.handler'

export const Route = createFileRoute(
  '/api/learn/resources/$resourceId/bookmark',
)({
  server: {
    handlers: {
      POST: ({ params }) => handleAddResourceBookmark(params.resourceId),
      DELETE: ({ params }) => handleRemoveResourceBookmark(params.resourceId),
    },
  },
})
