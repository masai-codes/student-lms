/**
 * TicketListingPage — the "Raised Tickets" tab.
 *
 * Faithful port of the legacy listing: the unresolved / resolved / all sub-tabs,
 * the ticket cards + callback-request cards, an empty state, and pagination.
 * Tickets come from this repo's paginated list endpoint; callback requests come
 * from the aggregated overview (filtered by tab client-side, like the original).
 * Tapping a ticket opens the conversation modal via search params.
 */

import { useQuery } from '@tanstack/react-query'
import { Phone } from '@phosphor-icons/react'

import type {
  CallbackTicketItem,
  TicketListItem,
  TicketStatus,
} from '@/server/api/support/support.types'
import {
  supportOverviewQuery,
  supportTicketsQuery,
} from '@/query/support/supportQueries'
import { CreateTicketModal } from '@/components/features/support/CreateTicketModal'
import { supportRouteApi } from '@/components/features/support/supportRoute'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'

const TAB_OPTIONS = [
  { label: 'unresolved', value: 'unresolved' as const },
  { label: 'resolved', value: 'resolved' as const },
  { label: 'all', value: 'all' as const },
]

export function TicketListingPage({ batchId }: { batchId: string }) {
  const navigate = supportRouteApi.useNavigate()
  const search = supportRouteApi.useSearch()
  const tab: 'unresolved' | 'resolved' | 'all' =
    search.tab === 'resolved' || search.tab === 'all' ? search.tab : 'unresolved'
  const page = search.page ?? 1

  const { data, isLoading } = useQuery(supportTicketsQuery(tab, page))
  const { data: overview } = useQuery(supportOverviewQuery())
  const tickets = data?.tickets ?? []

  const callbackTickets = (overview?.callbackTickets ?? []).filter((t) => {
    if (tab === 'resolved') return t.status.toLowerCase() === 'resolved'
    if (tab === 'unresolved') return t.status.toLowerCase() !== 'resolved'
    return true
  })

  const showDetails = search.step === 'ticketdetails' && Boolean(search.ticketId)

  const setTab = (value: string) =>
    void navigate({ search: (p) => ({ ...p, tickets: 'ticketlisting', tab: value, page: undefined }) })

  const openTicket = (id: number) =>
    void navigate({
      search: (p) => ({ ...p, tickets: 'ticketlisting', step: 'ticketdetails', ticketId: id }),
    })

  const closeDetails = () =>
    void navigate({
      search: (p) => ({ ...p, step: undefined, ticketId: undefined, category: undefined, subcategory: undefined }),
    })

  const isEmpty = !isLoading && tickets.length === 0 && callbackTickets.length === 0

  return (
    <>
      {/* Sub-tabs */}
      <div className="flex gap-3 mb-4">
        {TAB_OPTIONS.map((opt) => {
          const active = tab === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTab(opt.value)}
              className={`h-10 rounded-[8px] px-4 text-[14px] font-[500] capitalize transition-colors ${
                active
                  ? 'text-[#6962AC] bg-[#EBF5FF] border border-[#A4CAFE]'
                  : 'text-[#374151] bg-white border border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 pb-[15px] md:bg-white md:border md:border-gray-200 md:p-[24px] md:rounded-[16px]">
        {isLoading && <p className="font-poppins text-sm text-gray-500 py-6 text-center">Loading…</p>}

        {tickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} onClick={() => openTicket(ticket.id)} />
        ))}

        {callbackTickets.map((cb) => (
          <CallbackRow key={`callback-${cb.id}`} ticket={cb} />
        ))}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-poppins text-[15px] font-semibold text-gray-900">No tickets yet</p>
            <p className="font-poppins text-[13px] text-gray-500 mt-1">
              Raise a ticket from the Help tab and it’ll show up here.
            </p>
          </div>
        )}
      </div>

      {/* Pagination (prev / next; a full page implies there may be more) */}
      {(page > 1 || tickets.length >= 10) && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => void navigate({ search: (p) => ({ ...p, page: Math.max(1, page - 1) }) })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="font-poppins text-sm text-gray-600">Page {page}</span>
          <button
            type="button"
            disabled={tickets.length < 10}
            onClick={() => void navigate({ search: (p) => ({ ...p, page: page + 1 }) })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {showDetails && (
        <CreateTicketModal
          category={search.category}
          subcategory={search.subcategory}
          onClose={closeDetails}
          onBack={closeDetails}
          batchId={batchId}
        />
      )}
    </>
  )
}

const STATUS_CHIP: Record<TicketStatus, string> = {
  open: 'bg-[#ebf5ff] text-[#8997f8]',
  're-opened': 'bg-[#fef8e4] text-[#ffc391]',
  resolved: 'bg-[#eefff8] text-[#0d930f]',
  closed: 'bg-[#f5fcff] text-[#31afc3]',
  automatic: 'bg-[#eefff8] text-[#0d930f]',
}

function TicketRow({ ticket, onClick }: { ticket: TicketListItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] p-3 flex justify-between md:items-center shadow-sm hover:shadow-md transition-shadow border gap-3 box-border bg-white text-left"
    >
      <div className="flex flex-col min-w-0">
        <h4 className="truncate text-[14px] font-poppins font-medium text-[#1F2A37]">{ticket.title}</h4>
        <div className="flex items-center text-sm flex-wrap gap-3 mt-1">
          <span className="first-letter:uppercase text-[#4B5563] text-[12px] font-poppins capitalize">
            {ticket.category.replace(/[-_]/g, ' ')}
          </span>
          {ticket.updatedAt && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <span className="text-[12px] text-[#374151]">{formatSocialPostTime(ticket.updatedAt)}</span>
            </span>
          )}
        </div>
      </div>
      <span className={`shrink-0 self-start px-2 py-[2px] rounded-full text-xs font-bold capitalize ${STATUS_CHIP[ticket.status]}`}>
        {ticket.status}
      </span>
    </button>
  )
}

function CallbackRow({ ticket }: { ticket: CallbackTicketItem }) {
  const timestamp = ticket.updatedAt || ticket.createdAt
  return (
    <div className="rounded-[12px] p-3 flex justify-between md:items-center shadow-sm border gap-3 box-border bg-white">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Phone className="text-[#6962AC] w-4 h-4" aria-hidden />
          <h4 className="text-[14px] font-poppins font-medium text-[#1F2A37]">Callback Request</h4>
        </div>
        <div className="flex items-center text-sm flex-wrap gap-4 mt-1">
          <span className="text-[#4B5563] text-[12px] font-poppins capitalize">{ticket.category}</span>
          {timestamp && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <span className="text-[12px] text-[#374151]">{formatSocialPostTime(timestamp)}</span>
            </span>
          )}
          {ticket.preferredTimeSlot && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <span className="text-[12px] text-[#4B5563] font-poppins">Preferred slot: {ticket.preferredTimeSlot}</span>
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 self-start px-2 py-[2px] rounded-full text-xs font-bold capitalize bg-[#fef8e4] text-[#b78a3a]">
        {ticket.status}
      </span>
    </div>
  )
}
