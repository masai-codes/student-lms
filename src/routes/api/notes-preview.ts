import { createFileRoute } from '@tanstack/react-router'

import { handleGetNotesPreview } from '@/server/api/notes-preview/handlers/getNotesPreview.handler'

export const Route = createFileRoute('/api/notes-preview')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetNotesPreview(request),
    },
  },
})
