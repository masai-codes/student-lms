import { createFileRoute } from '@tanstack/react-router'
import { handleGetInvoices } from '@/server/api/profile/handlers/profileTabs.handler'

export const Route = createFileRoute('/api/profile/invoices')({
  server: {
    handlers: {
      GET: () => handleGetInvoices(),
    },
  },
})
