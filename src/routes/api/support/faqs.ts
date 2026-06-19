import { createFileRoute } from '@tanstack/react-router'
import { handleSearchFaqs } from '@/server/api/support/handlers/faqs.handler'

/** GET /api/support/faqs — search/list FAQs for a batch. */
export const Route = createFileRoute('/api/support/faqs')({
  server: {
    handlers: {
      GET: ({ request }) => handleSearchFaqs(request),
    },
  },
})
