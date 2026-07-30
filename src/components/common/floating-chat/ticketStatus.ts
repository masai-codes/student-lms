import type { TicketStatus } from '@/server/api/support/support.types'
import type { TicketFilter } from '@/components/common/floating-chat/types'

const RESOLVED_STATUSES: ReadonlyArray<TicketStatus> = [
  'resolved',
  'closed',
  'automatic',
]

export function isResolvedTicketStatus(status: TicketStatus): boolean {
  return RESOLVED_STATUSES.includes(status)
}

export function ticketStatusLabel(status: TicketStatus): string {
  if (status === 're-opened') return 'Reopened'
  if (isResolvedTicketStatus(status)) return 'Resolved'
  return 'Open'
}

/** Callback requests only have pending/resolved — pending maps to the Open chip. */
export function matchesCallbackTicketFilter(
  status: string,
  filter: TicketFilter,
): boolean {
  const normalized = status.trim().toLowerCase()
  if (filter === 'all') return true
  if (filter === 'resolved') return normalized === 'resolved'
  if (filter === 'open') return normalized === 'pending'
  return false
}
