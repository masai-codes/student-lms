import { createFileRoute } from '@tanstack/react-router'

import { handleGetAiTutorTranscript } from '@/server/api/ai-tutor/handlers/getTranscript.handler'

export const Route = createFileRoute('/api/learn/ai-tutor/$lectureId/transcript')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetAiTutorTranscript(request, params.lectureId),
    },
  },
})
