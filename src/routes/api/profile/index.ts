import { createFileRoute } from '@tanstack/react-router'
import {
  handleGetProfileOverview,
  handleUpdateProfile,
} from '@/server/api/profile/handlers/profileOverview.handler'

export const Route = createFileRoute('/api/profile/')({
  server: {
    handlers: {
      GET: () => handleGetProfileOverview(),
      PATCH: ({ request }) => handleUpdateProfile(request),
    },
  },
})
