import { createFileRoute } from '@tanstack/react-router'

import { handleGetAiTutorTranscript } from '@/server/api/ai-tutor/handlers/getTranscript.handler'

export const Route = createFileRoute(
  '/api/learn/ai-tutor/$lectureId/transcript',
)({
  server: {
    handlers: {
      GET: ({ params }) => handleGetAiTutorTranscript(params.lectureId),
    },
  },
})
