import type {
  CallbackTicketItem,
  TicketListItem,
} from '@/server/api/support/support.types'

export type RaisedSupportListItem =
  | { kind: 'ticket'; item: TicketListItem }
  | { kind: 'callback'; item: CallbackTicketItem }

function raisedAtMs(iso: string | null | undefined, fallbackId: number): number {
  if (iso) {
    const ms = Date.parse(iso)
    if (!Number.isNaN(ms)) return ms
  }
  return fallbackId
}

/** Merge support tickets + callback requests, newest raised first. */
export function mergeRaisedSupportItems(
  tickets: TicketListItem[],
  callbacks: CallbackTicketItem[],
): Array<RaisedSupportListItem> {
  const entries: Array<RaisedSupportListItem> = [
    ...tickets.map((item) => ({ kind: 'ticket' as const, item })),
    ...callbacks.map((item) => ({ kind: 'callback' as const, item })),
  ]

  return entries.sort((a, b) => {
    const aRaised = a.item.createdAt
    const bRaised = b.item.createdAt
    const diff =
      raisedAtMs(bRaised, b.item.id) - raisedAtMs(aRaised, a.item.id)
    if (diff !== 0) return diff
    return b.item.id - a.item.id
  })
}
