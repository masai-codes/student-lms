import { createFileRoute } from '@tanstack/react-router'
import { handleGetAgreementData } from '@/server/api/dashboard/handlers/getAgreementData.handler'

export const Route = createFileRoute('/api/dashboard/agreement/$sectionId')({
  server: {
    handlers: {
      GET: ({ params }) => handleGetAgreementData(params.sectionId),
    },
  },
})
