import { createFileRoute } from '@tanstack/react-router'
import { handleGetT0FlowDocuments } from '@/server/api/dashboard/handlers/getT0FlowDocuments.handler'

export const Route = createFileRoute('/api/dashboard/t0-flow-documents')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetT0FlowDocuments(request),
    },
  },
})
