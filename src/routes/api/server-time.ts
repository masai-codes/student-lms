import { createFileRoute } from '@tanstack/react-router'
import { handleGetServerTime } from '@/server/api/serverTime/getServerTime.handler'

export const Route = createFileRoute('/api/server-time')({
  server: {
    handlers: {
      GET: () => handleGetServerTime(),
    },
  },
})
