import { createFileRoute } from '@tanstack/react-router'
import { handleSubmitPracticeQuestionAnswers } from '@/server/api/ai-tutor/handlers/submitPracticeQuestionAnswers.handler'

export const Route = createFileRoute(
  '/api/ai-tutor/chat/practice-questions/answers',
)({
  server: {
    handlers: {
      POST: ({ request }) => handleSubmitPracticeQuestionAnswers(request),
    },
  },
})
