import { createFileRoute } from '@tanstack/react-router'
import { handleIngestLectureRag } from '@/server/api/ai-tutor/handlers/ingestLectureRag.handler'

export const Route = createFileRoute('/api/ai-tutor/lectures/$lectureId/ingest')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleIngestLectureRag(request, params.lectureId),
    },
  },
})
