import { describe, expect, it } from 'vitest'

import { computeCatchUpWindow } from '../computeCatchUpWindow'

describe('computeCatchUpWindow', () => {
  const concludes = '2026-05-01T12:00:00.000Z'
  const nowMs = new Date('2026-05-04T12:00:00.000Z').getTime()

  it('returns null window when student is present', () => {
    expect(
      computeCatchUpWindow({
        schedule: concludes,
        concludes,
        catchUpDays: 5,
        includeVideoAttendance: true,
        isAbsent: false,
        nowMs,
      }),
    ).toEqual({
      daysRemaining: null,
      isCatchupWindowOver: null,
    })
  })

  it('computes remaining catch-up days for absent students', () => {
    expect(
      computeCatchUpWindow({
        schedule: concludes,
        concludes,
        catchUpDays: 5,
        includeVideoAttendance: true,
        isAbsent: true,
        nowMs,
      }),
    ).toEqual({
      daysRemaining: 2,
      isCatchupWindowOver: false,
    })
  })

  // Regression: the count is whole days elapsed, matching the legacy LMS. A
  // countdown to the exact window-close instant would floor the residual hours
  // and render one day fewer (here: 1 instead of 2).
  it('does not shave a day for a partial-day residual', () => {
    expect(
      computeCatchUpWindow({
        schedule: concludes,
        concludes,
        catchUpDays: 5,
        includeVideoAttendance: true,
        isAbsent: true,
        nowMs: nowMs + 23 * 60 * 60 * 1000,
      }).daysRemaining,
    ).toBe(2)
  })

  it('marks window over when elapsed days exceed catch-up allowance', () => {
    const lateNow = new Date('2026-05-10T12:00:00.000Z').getTime()
    expect(
      computeCatchUpWindow({
        schedule: concludes,
        concludes,
        catchUpDays: 5,
        includeVideoAttendance: true,
        isAbsent: true,
        nowMs: lateNow,
      }),
    ).toEqual({
      daysRemaining: 0,
      isCatchupWindowOver: true,
    })
  })
})
