import { createFileRoute } from '@tanstack/react-router'
import { handleGetInterviewTopics } from '@/server/api/interviews/handlers/getTopics.handler'

export const Route = createFileRoute('/api/interviews/topics')({
  server: {
    handlers: {
      GET: () => handleGetInterviewTopics(),
    },
  },
})
