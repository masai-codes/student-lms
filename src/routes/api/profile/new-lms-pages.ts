import { createFileRoute } from '@tanstack/react-router'
import {
  handleGetNewLmsPagesPreference,
  handleUpdateNewLmsPagesPreference,
} from '@/server/api/profile/handlers/newLmsPreference.handler'

export const Route = createFileRoute('/api/profile/new-lms-pages')({
  server: {
    handlers: {
      GET: () => handleGetNewLmsPagesPreference(),
      PUT: ({ request }) => handleUpdateNewLmsPagesPreference(request),
    },
  },
})
