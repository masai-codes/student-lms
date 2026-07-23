import { createFileRoute } from '@tanstack/react-router'
import { handleGetBookmarkFilterOptions } from '@/server/api/bookmarks/handlers/getBookmarkFilterOptions.handler'

export const Route = createFileRoute('/api/bookmarks/filter-options')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetBookmarkFilterOptions(request),
    },
  },
})
