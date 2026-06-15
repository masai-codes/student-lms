import { createFileRoute } from '@tanstack/react-router'
import { handleRecordAgreementOpen } from '@/server/api/dashboard/handlers/recordAgreementOpen.handler'

export const Route = createFileRoute('/api/dashboard/agreement/$sectionId/open')({
  server: {
    handlers: {
      POST: ({ request }) => handleRecordAgreementOpen(request),
    },
  },
})
