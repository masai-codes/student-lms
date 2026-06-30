import { createFileRoute } from '@tanstack/react-router'
import { handleGetSubcategories } from '@/server/api/support/handlers/faqs.handler'

/** GET /api/support/subcategories?category= — subcategories for one category. */
export const Route = createFileRoute('/api/support/subcategories')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetSubcategories(request),
    },
  },
})
