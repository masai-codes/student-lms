import { createFileRoute } from '@tanstack/react-router'
import {
  handleAddBookmark,
  handleRemoveBookmark,
} from '@/server/api/announcement/handlers/announcementBookmark.handler'

export const Route = createFileRoute('/api/announcement/$id/bookmark')({
  server: {
    handlers: {
      POST: ({ params }) => handleAddBookmark(params.id),
      DELETE: ({ params }) => handleRemoveBookmark(params.id),
    },
  },
})
