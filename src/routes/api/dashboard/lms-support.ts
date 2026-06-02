import { createFileRoute } from '@tanstack/react-router'
import { handleGetLmsSupportInfo } from '@/server/api/dashboard/handlers/getLmsSupportInfo.handler'

export const Route = createFileRoute('/api/dashboard/lms-support')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetLmsSupportInfo(request),
    },
  },
})
