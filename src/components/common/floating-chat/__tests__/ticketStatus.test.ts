import { describe, expect, it } from 'vitest'
import { matchesCallbackTicketFilter } from '@/components/common/floating-chat/ticketStatus'

describe('matchesCallbackTicketFilter', () => {
  it('shows pending callbacks only under all and open', () => {
    expect(matchesCallbackTicketFilter('pending', 'all')).toBe(true)
    expect(matchesCallbackTicketFilter('pending', 'open')).toBe(true)
    expect(matchesCallbackTicketFilter('pending', 're-opened')).toBe(false)
    expect(matchesCallbackTicketFilter('pending', 'resolved')).toBe(false)
  })

  it('shows resolved callbacks only under all and resolved', () => {
    expect(matchesCallbackTicketFilter('resolved', 'all')).toBe(true)
    expect(matchesCallbackTicketFilter('resolved', 'resolved')).toBe(true)
    expect(matchesCallbackTicketFilter('resolved', 'open')).toBe(false)
    expect(matchesCallbackTicketFilter('resolved', 're-opened')).toBe(false)
  })
})
