import { describe, expect, it } from 'vitest'

import { formatTicketMessageSentAt } from './formatTicketMessageSentAt'

describe('formatTicketMessageSentAt', () => {
  it('formats a DB created_at as Sent · h:mm AM/PM', () => {
    // Fixed UTC instant → local wall clock; assert shape, not a fixed zone.
    const label = formatTicketMessageSentAt('2026-07-18T03:44:00.000Z')
    expect(label).toMatch(/^Sent · \d{1,2}:\d{2} (AM|PM)$/)
  })

  it('returns null for missing or invalid timestamps', () => {
    expect(formatTicketMessageSentAt(null)).toBeNull()
    expect(formatTicketMessageSentAt(undefined)).toBeNull()
    expect(formatTicketMessageSentAt('')).toBeNull()
    expect(formatTicketMessageSentAt('not-a-date')).toBeNull()
  })
})
