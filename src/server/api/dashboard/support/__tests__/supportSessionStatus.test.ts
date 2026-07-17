import { describe, expect, it } from 'vitest'
import { resolveSupportSessionStatus } from '../supportSessionStatus'

// 2026-07-02 12:00:00 IST as an absolute instant.
const NOW = new Date('2026-07-02T12:00:00+05:30')

describe('resolveSupportSessionStatus', () => {
  it('is live when now is between schedule and concludes', () => {
    expect(
      resolveSupportSessionStatus(
        '2026-07-02 11:00:00',
        '2026-07-02 13:00:00',
        NOW,
      ),
    ).toBe('live')
  })

  it('is live for an open-ended (null concludes) session that has started', () => {
    expect(resolveSupportSessionStatus('2026-07-02 11:00:00', null, NOW)).toBe(
      'live',
    )
  })

  it('is today for a later-today session that has not started', () => {
    expect(
      resolveSupportSessionStatus(
        '2026-07-02 15:00:00',
        '2026-07-02 16:00:00',
        NOW,
      ),
    ).toBe('today')
  })

  it('is today for an earlier-today session that already ended', () => {
    expect(
      resolveSupportSessionStatus(
        '2026-07-02 09:00:00',
        '2026-07-02 10:00:00',
        NOW,
      ),
    ).toBe('today')
  })

  it('is upcoming for a future-day session', () => {
    expect(
      resolveSupportSessionStatus(
        '2026-07-05 10:00:00',
        '2026-07-05 11:00:00',
        NOW,
      ),
    ).toBe('upcoming')
  })

  it('is upcoming when the schedule is missing', () => {
    expect(resolveSupportSessionStatus(null, null, NOW)).toBe('upcoming')
  })

  // The `istDatetime` column returns offset-stamped ISO strings (`…+05:30`),
  // not space-separated wall-clock. These must resolve identically.
  it('handles offset-stamped ISO schedules (production format)', () => {
    expect(
      resolveSupportSessionStatus(
        '2026-07-02T11:00:00+05:30',
        '2026-07-02T13:00:00+05:30',
        NOW,
      ),
    ).toBe('live')
    expect(
      resolveSupportSessionStatus(
        '2026-07-02T15:00:00+05:30',
        '2026-07-02T16:00:00+05:30',
        NOW,
      ),
    ).toBe('today')
    expect(
      resolveSupportSessionStatus(
        '2026-07-05T10:00:00+05:30',
        '2026-07-05T11:00:00+05:30',
        NOW,
      ),
    ).toBe('upcoming')
  })
})
