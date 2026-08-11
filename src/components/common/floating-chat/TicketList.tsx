import { cn } from '@/lib/utils'
import { Phone, Ticket } from '@phosphor-icons/react'
import type {
  CallbackTicketItem,
  TicketListItem,
  TicketStatus,
} from '@/server/api/support/support.types'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { mergeRaisedSupportItems } from '@/lib/support/mergeRaisedSupportItems'
import type { TicketFilter } from './types'
import {
  isResolvedTicketStatus,
  matchesCallbackTicketFilter,
} from './ticketStatus'

interface TicketListProps {
  tickets: TicketListItem[]
  callbackTickets: CallbackTicketItem[]
  filter: TicketFilter
  onFilterChange: (filter: TicketFilter) => void
  onTicketSelect: (ticketId: number) => void
}

function matchesFilter(status: TicketStatus, filter: TicketFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'open') return status === 'open'
  if (filter === 're-opened') return status === 're-opened'
  return isResolvedTicketStatus(status)
}

function statusChip(status: TicketStatus): {
  label: string
  className: string
} {
  if (status === 're-opened') {
    return {
      label: 'Reopened',
      className:
        'bg-[#fef3e2] text-[#b45309] dark:bg-warning-subtle dark:text-warning-subtle-foreground',
    }
  }
  if (isResolvedTicketStatus(status)) {
    return {
      label: 'Resolved',
      className:
        'bg-[#e8f7ee] text-[#0E9F6E] dark:bg-success-subtle dark:text-success-subtle-foreground',
    }
  }
  return {
    label: 'Open',
    className:
      'bg-[#f0f0fd] text-[#4338ca] dark:bg-brand-subtle dark:text-brand-subtle-foreground',
  }
}

function callbackStatusChip(status: string): {
  label: string
  className: string
} {
  if (status.toLowerCase() === 'resolved') {
    return {
      label: 'Resolved',
      className:
        'bg-[#e8f7ee] text-[#0E9F6E] dark:bg-success-subtle dark:text-success-subtle-foreground',
    }
  }
  return {
    label: status,
    className:
      'bg-[#fef3e2] text-[#b45309] dark:bg-warning-subtle dark:text-warning-subtle-foreground',
  }
}

export function TicketList({
  tickets,
  callbackTickets,
  filter,
  onFilterChange,
  onTicketSelect,
}: TicketListProps) {
  const filteredTickets = tickets.filter((t) => matchesFilter(t.status, filter))
  const filteredCallbacks = callbackTickets.filter((cb) =>
    matchesCallbackTicketFilter(cb.status, filter),
  )

  const raisedItems = mergeRaisedSupportItems(
    filteredTickets,
    filteredCallbacks,
  )
  const isEmpty = raisedItems.length === 0

  return (
    <>
      <div className="flex items-center gap-2 mb-2 shrink-0 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {(['all', 'open', 're-opened', 'resolved'] as TicketFilter[]).map(
          (f) => {
            const labels: Record<TicketFilter, string> = {
              all: 'All',
              open: 'Open',
              're-opened': 'Reopened',
              resolved: 'Resolved',
            }
            const isActive = filter === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => onFilterChange(f)}
                className={cn(
                  'px-[13px] py-[6px] rounded-full text-[12px] font-bold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-[#4b4396] text-white shadow-sm'
                    : 'bg-[#f1f1f7] text-[#62647d] hover:bg-[#e3e3fb] hover:text-[#4b4396] dark:bg-muted dark:text-foreground-muted dark:hover:bg-accent dark:hover:text-brand',
                )}
              >
                {labels[f]}
              </button>
            )
          },
        )}
      </div>

      {raisedItems.map((row) => {
        if (row.kind === 'ticket') {
          const ticket = row.item
          const chip = statusChip(ticket.status)
          return (
            <button
              key={`ticket-${ticket.id}`}
              type="button"
              onClick={() => onTicketSelect(ticket.id)}
              className="w-full text-left p-[13px_12px] border border-[#e9e9f3] rounded-[14px] shrink-0 cursor-pointer transition-colors hover:bg-[#f0f0fd] hover:border-[#e3e3fb] dark:border-border dark:hover:bg-accent dark:hover:border-border-strong"
            >
              <div className="flex items-center justify-between gap-2 mb-[7px]">
                <div className="flex items-center gap-1.5 text-[#62647d] dark:text-foreground-muted text-[11.8px] font-bold min-w-0">
                  <Ticket
                    weight="fill"
                    className="size-[14px] text-[#4b4396] dark:text-brand shrink-0"
                  />
                  <span className="truncate capitalize">
                    {ticket.category.replace(/[-_]/g, ' ')}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-bold px-[9px] py-[3px] rounded-full shrink-0 whitespace-nowrap',
                    chip.className,
                  )}
                >
                  {chip.label}
                </span>
              </div>
              <div className="text-[13.8px] font-bold text-[#15162c] dark:text-foreground mb-1 truncate">
                {ticket.title}
              </div>
              <div className="text-[11.2px] text-[#9496ab] dark:text-foreground-subtle">
                #{ticket.id}
                {ticket.createdAt
                  ? ` · raised ${formatSocialPostTime(ticket.createdAt)}`
                  : ''}
                {ticket.hasUnread ? ' · New reply' : ''}
              </div>
            </button>
          )
        }

        const cb = row.item
        const chip = callbackStatusChip(cb.status)
        const timestamp = cb.createdAt
        return (
          <div
            key={`callback-${cb.id}`}
            className="p-[13px_12px] border border-[#e3e3fb] rounded-[14px] shrink-0 bg-[#fafaff] dark:border-border dark:bg-surface-muted"
          >
            <div className="flex items-center justify-between gap-2 mb-[7px]">
              <div className="flex items-center gap-1.5 text-[#62647d] dark:text-foreground-muted text-[11.8px] font-bold min-w-0">
                <Phone
                  weight="fill"
                  className="size-[14px] text-[#4b4396] dark:text-brand shrink-0"
                />
                <span>Callback request</span>
              </div>
              <span
                className={cn(
                  'text-[11px] font-bold px-[9px] py-[3px] rounded-full shrink-0 whitespace-nowrap capitalize',
                  chip.className,
                )}
              >
                {chip.label}
              </span>
            </div>
            <div className="text-[13.8px] font-bold text-[#15162c] dark:text-foreground mb-1 truncate capitalize">
              {cb.category.replace(/[-_]/g, ' ')}
            </div>
            <div className="text-[12.4px] text-[#62647d] dark:text-foreground-muted mb-[7px] truncate">
              {cb.preferredTimeSlot
                ? `Preferred slot: ${cb.preferredTimeSlot}`
                : 'Callback scheduled'}
            </div>
            <div className="text-[11.2px] text-[#9496ab] dark:text-foreground-subtle">
              #{cb.id}
              {timestamp ? ` · raised ${formatSocialPostTime(timestamp)}` : ''}
            </div>
          </div>
        )
      })}

      {isEmpty && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="text-[14px] font-bold text-[#15162c] dark:text-foreground">No tickets yet</p>
          <p className="text-[12.5px] text-[#62647d] dark:text-foreground-muted">
            Raise a ticket from Help and it&apos;ll show up here.
          </p>
        </div>
      )}
    </>
  )
}
