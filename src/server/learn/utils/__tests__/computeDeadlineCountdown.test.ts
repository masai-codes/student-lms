import { describe, expect, it } from 'vitest'
import { computeDeadlineCountdown } from '../computeDeadlineCountdown'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const NOW = 1_000_000_000_000

// Deadline built as an epoch offset from NOW so the test is timezone-independent.
const at = (offsetMs: number) =>
  new Date(NOW + offsetMs).toISOString().replace('T', ' ').slice(0, 19)

describe('computeDeadlineCountdown', () => {
  it('counts whole days remaining when >= 1 day', () => {
    // Parsed as local; compare an offset built the same way so tz cancels out.
    const deadline = at(3 * DAY + HOUR)
    const result = computeDeadlineCountdown(
      deadline,
      new Date(deadline).getTime() - (3 * DAY + HOUR),
    )
    expect(result).toEqual({
      totalMs: 3 * DAY + HOUR,
      label: '3 days remaining',
    })
  })

  it('uses singular "1 day remaining"', () => {
    const deadline = at(0)
    expect(
      computeDeadlineCountdown(
        deadline,
        new Date(deadline).getTime() - (DAY + HOUR),
      )?.label,
    ).toBe('1 day remaining')
  })

  it('shows hr + min when under a day', () => {
    const deadline = at(0)
    expect(
      computeDeadlineCountdown(
        deadline,
        new Date(deadline).getTime() - (2 * HOUR + 30 * 60 * 1000),
      )?.label,
    ).toBe('2 hr 30 min remaining')
  })

  it('returns null with no deadline or once it has passed', () => {
    expect(computeDeadlineCountdown(null, NOW)).toBeNull()
    const deadline = at(0)
    expect(
      computeDeadlineCountdown(deadline, new Date(deadline).getTime() + HOUR),
    ).toBeNull()
  })
})
