import { createFileRoute } from '@tanstack/react-router'
import { handleGetBookmarks } from '@/server/api/bookmarks/handlers/getBookmarks.handler'

export const Route = createFileRoute('/api/bookmarks/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetBookmarks(request),
    },
  },
})
