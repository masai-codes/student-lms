import { createFileRoute } from '@tanstack/react-router'

import { handleGetLectureFaqs } from '@/server/api/ai-tutor/handlers/getLectureFaqs.handler'

export const Route = createFileRoute('/api/ai-tutor/lectures/$lectureId/faqs')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetLectureFaqs(params.lectureId),
    },
  },
})
