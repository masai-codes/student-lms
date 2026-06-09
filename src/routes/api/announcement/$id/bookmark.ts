import { createFileRoute } from '@tanstack/react-router'
import {
  handleAddBookmark,
  handleRemoveBookmark,
} from '@/server/api/announcement/handlers/announcementBookmark.handler'

export const Route = createFileRoute('/api/announcement/$id/bookmark')({
  server: {
    handlers: {
      POST: ({ request, params }) => handleAddBookmark(request, params.id),
      DELETE: ({ request, params }) => handleRemoveBookmark(request, params.id),
    },
  },
})
