import { createFileRoute } from '@tanstack/react-router'

import type { SupportSearch } from '@/components/features/support/supportRoute'
import { BatchTickets } from '@/components/features/support'

/**
 * `/support` — the support landing, faithful to the legacy `BatchTickets` flow.
 *
 * The whole feature (Help / Raised Tickets / 1:1 Support tabs, the create +
 * conversation modal, and the callback flow) lives on this one route and is
 * driven by URL search params — exactly like the original. {@link BatchTickets}
 * loads everything from the single aggregated overview query and manages the
 * rest client-side.
 */
export const Route = createFileRoute('/(protected)/_layout/support/')({
  validateSearch: (search: Record<string, unknown>): SupportSearch => ({
    tickets:
      search.tickets === 'ticketlisting' || search.tickets === 'pair-programming'
        ? search.tickets
        : undefined,
    tab: typeof search.tab === 'string' ? search.tab : undefined,
    step:
      search.step === 'ticketCreate' || search.step === 'ticketdetails'
        ? search.step
        : undefined,
    ticketId:
      search.ticketId != null && Number(search.ticketId) > 0
        ? Number(search.ticketId)
        : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    subcategory:
      typeof search.subcategory === 'string' ? search.subcategory : undefined,
    page:
      search.page != null && Number(search.page) > 0 ? Number(search.page) : undefined,
  }),
  component: BatchTickets,
})
