import { createFileRoute } from '@tanstack/react-router'
import { handleGetAnnouncementFilterOptions } from '@/server/api/announcement/handlers/getAnnouncementFilterOptions.handler'

export const Route = createFileRoute('/api/announcement/filter-options')({
  server: {
    handlers: {
      GET: () => handleGetAnnouncementFilterOptions(),
    },
  },
})
