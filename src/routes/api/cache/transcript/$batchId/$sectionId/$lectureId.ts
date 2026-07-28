import { createFileRoute } from '@tanstack/react-router'

import { handleGetCachedLectureTranscript } from '@/server/api/cache/handlers/getLectureTranscript.handler'

export const Route = createFileRoute(
  '/api/cache/transcript/$batchId/$sectionId/$lectureId',
)({
  server: {
    handlers: {
      GET: ({ params }) => handleGetCachedLectureTranscript(params),
    },
  },
})
