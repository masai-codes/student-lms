import type { TicketStatus } from '@/server/api/support/support.types'

const RESOLVED_STATUSES: ReadonlyArray<TicketStatus> = ['resolved', 'closed', 'automatic']

export function isResolvedTicketStatus(status: TicketStatus): boolean {
  return RESOLVED_STATUSES.includes(status)
}

export function ticketStatusLabel(status: TicketStatus): string {
  if (status === 're-opened') return 'Reopened'
  if (isResolvedTicketStatus(status)) return 'Resolved'
  return 'Open'
}
