import { describe, expect, it } from 'vitest'
import type {
  CallbackTicketItem,
  TicketListItem,
} from '@/server/api/support/support.types'
import { mergeRaisedSupportItems } from '../mergeRaisedSupportItems'

const ticket = (
  input: Partial<TicketListItem> & Pick<TicketListItem, 'id'>,
): TicketListItem => ({
  title: 'Ticket',
  category: 'lecture',
  status: 'open',
  rating: 0,
  updatedAt: null,
  hasUnread: false,
  createdAt: null,
  ...input,
})

const callback = (
  input: Partial<CallbackTicketItem> & Pick<CallbackTicketItem, 'id'>,
): CallbackTicketItem => ({
  batchId: 1,
  category: 'general',
  status: 'pending',
  preferredTimeSlot: null,
  createdAt: null,
  updatedAt: null,
  ...input,
})

describe('mergeRaisedSupportItems', () => {
  it('sorts tickets and callbacks by raised time descending', () => {
    const merged = mergeRaisedSupportItems(
      [
        ticket({ id: 1, createdAt: '2026-01-01T10:00:00.000Z' }),
        ticket({ id: 2, createdAt: '2026-01-03T10:00:00.000Z' }),
      ],
      [callback({ id: 10, createdAt: '2026-01-02T10:00:00.000Z' })],
    )

    expect(merged.map((row) => `${row.kind}:${row.item.id}`)).toEqual([
      'ticket:2',
      'callback:10',
      'ticket:1',
    ])
  })

  it('falls back to id when raised timestamps are missing', () => {
    const merged = mergeRaisedSupportItems(
      [ticket({ id: 5 }), ticket({ id: 9 })],
      [callback({ id: 7 })],
    )

    expect(merged.map((row) => row.item.id)).toEqual([9, 7, 5])
  })
})
