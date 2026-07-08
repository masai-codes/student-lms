import { createFileRoute } from '@tanstack/react-router'
import { handleRecordAgreementViewed } from '@/server/api/dashboard/handlers/recordAgreementViewed.handler'

export const Route = createFileRoute('/api/dashboard/agreement/view')({
  server: {
    handlers: {
      POST: ({ request }) => handleRecordAgreementViewed(request),
    },
  },
})
