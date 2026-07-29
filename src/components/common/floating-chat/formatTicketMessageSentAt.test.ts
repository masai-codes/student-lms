import { describe, expect, it } from 'vitest'

import { formatTicketMessageSentAt } from './formatTicketMessageSentAt'

describe('formatTicketMessageSentAt', () => {
  it('formats a DB created_at as Sent · h:mm AM/PM after subtracting 5:30', () => {
    const raw = '2026-07-18T09:14:00.000Z'
    const label = formatTicketMessageSentAt(raw)
    const expectedTime = new Date(
      Date.parse(raw) - 5.5 * 60 * 60 * 1000,
    ).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    expect(label).toBe(`Sent · ${expectedTime}`)
  })

  it('returns null for missing or invalid timestamps', () => {
    expect(formatTicketMessageSentAt(null)).toBeNull()
    expect(formatTicketMessageSentAt(undefined)).toBeNull()
    expect(formatTicketMessageSentAt('')).toBeNull()
    expect(formatTicketMessageSentAt('not-a-date')).toBeNull()
  })
})
