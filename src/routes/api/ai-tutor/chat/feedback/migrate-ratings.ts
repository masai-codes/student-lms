import { createFileRoute } from '@tanstack/react-router'
import { handleMigrateFeedbackRatings } from '@/server/api/ai-tutor/handlers/migrateFeedbackRatings.handler'

export const Route = createFileRoute(
  '/api/ai-tutor/chat/feedback/migrate-ratings',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleMigrateFeedbackRatings(request),
    },
  },
})
