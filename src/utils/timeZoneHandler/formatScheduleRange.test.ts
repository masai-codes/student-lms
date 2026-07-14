import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  formatLectureRangeIST,
  formatLectureRangeLocal,
  formatScheduleRangeIST,
  formatScheduleRangeLocal,
  isTodayLocal,
} from './index'

/**
 * Pin the process timezone so the local-formatting tests are deterministic on
 * any machine/CI. Node honors runtime `process.env.TZ` for subsequent `Date`s,
 * and dayjs local mode reads the same zone.
 */
function pinTimezone(tz: string) {
  let original: string | undefined
  beforeAll(() => {
    original = process.env.TZ
    process.env.TZ = tz
  })
  afterAll(() => {
    process.env.TZ = original
  })
}

describe('formatScheduleRangeIST', () => {
  it('shows a leading date with a same-day time range', () => {
    expect(
      formatScheduleRangeIST('2026-07-02 18:30:00', '2026-07-02 19:30:00'),
    ).toBe('2 Jul, 6:30 PM - 7:30 PM (IST)')
  })

  it('includes both dates for a cross-day range', () => {
    expect(
      formatScheduleRangeIST('2026-07-02 23:00:00', '2026-07-03 01:00:00'),
    ).toBe('2 Jul, 11PM - 3 Jul, 1AM (IST)')
  })

  it('shows just the start when there is no end', () => {
    expect(formatScheduleRangeIST('2026-07-02 18:30:00', null)).toBe(
      '2 Jul, 6:30 PM (IST)',
    )
  })

  it('returns empty string for a missing start', () => {
    expect(formatScheduleRangeIST(null, null)).toBe('')
  })
})

describe('formatScheduleRangeLocal', () => {
  it('renders a device-local range with a leading date and a tz suffix', () => {
    const result = formatScheduleRangeLocal(
      '2026-07-02 18:30:00',
      '2026-07-02 19:30:00',
    )
    expect(result).toMatch(/^2 Jul, .+ - .+ \(.+\)$/)
  })

  it('renders just the start when there is no end', () => {
    const result = formatScheduleRangeLocal('2026-07-02 18:30:00', null)
    expect(result).toMatch(/^2 Jul, .+ \(.+\)$/)
    expect(result).not.toContain(' - ')
  })

  it('returns empty string for a missing start', () => {
    expect(formatScheduleRangeLocal(null, null)).toBe('')
  })
})

describe('formatLectureRangeIST', () => {
  it('keeps the year and shows an IST label with a same-day time range', () => {
    expect(
      formatLectureRangeIST('2026-05-10 15:30:00', '2026-05-10 17:30:00'),
    ).toBe('10 May 2026, 3:30 PM - 5:30 PM (IST)')
  })

  it('includes both dates for a cross-day range', () => {
    expect(
      formatLectureRangeIST('2026-05-10 23:00:00', '2026-05-11 01:00:00'),
    ).toBe('10 May 2026, 11PM - 11 May 2026, 1AM (IST)')
  })

  it('shows just the start when there is no end', () => {
    expect(formatLectureRangeIST('2026-05-10 15:30:00', null)).toBe(
      '10 May 2026, 3:30 PM (IST)',
    )
  })

  it('returns empty string for a missing start', () => {
    expect(formatLectureRangeIST(null, null)).toBe('')
  })
})

describe('formatLectureRangeLocal (IST viewer)', () => {
  pinTimezone('Asia/Kolkata')

  it('keeps the year and shows an IST label with a same-day time range', () => {
    expect(
      formatLectureRangeLocal('2026-05-10 15:30:00', '2026-05-10 17:30:00'),
    ).toBe('10 May 2026, 3:30 PM - 5:30 PM (IST)')
  })

  it('includes both dates for a cross-day range', () => {
    expect(
      formatLectureRangeLocal('2026-05-10 23:00:00', '2026-05-11 01:00:00'),
    ).toBe('10 May 2026, 11PM - 11 May 2026, 1AM (IST)')
  })

  it('returns empty string for a missing start', () => {
    expect(formatLectureRangeLocal(null, null)).toBe('')
  })
})

describe('formatLectureRangeLocal (non-IST viewer)', () => {
  // America/New_York is UTC-4 in May (EDT), 9.5h behind IST.
  pinTimezone('America/New_York')

  it('shifts the date/time into the viewer local zone and labels it', () => {
    // 3:30 PM IST on 2026-05-10 = 6:00 AM EDT on 2026-05-10.
    expect(
      formatLectureRangeLocal('2026-05-10 15:30:00', '2026-05-10 17:30:00'),
    ).toBe('10 May 2026, 6AM - 8AM (EDT)')
  })

  it('rolls back the local date when IST early-morning is the prior US day', () => {
    // 2:00 AM IST on 2026-05-11 = 4:30 PM EDT on 2026-05-10 (prior day locally).
    expect(formatLectureRangeLocal('2026-05-11 02:00:00', null)).toBe(
      '10 May 2026, 4:30 PM (EDT)',
    )
  })
})

describe('isTodayLocal (non-IST viewer)', () => {
  // America/New_York, 9.5h behind IST.
  pinTimezone('America/New_York')

  it('treats an IST-next-day early morning as today when it is today locally', () => {
    // 02:00 IST 2026-07-10 = 16:30 EDT 2026-07-09 → same local day as `now`.
    expect(
      isTodayLocal(
        '2026-07-10T02:00:00+05:30',
        new Date('2026-07-09T20:00:00-04:00'),
      ),
    ).toBe(true)
  })

  it('is false when the instant falls on a different local day', () => {
    expect(
      isTodayLocal(
        '2026-07-10T20:00:00+05:30',
        new Date('2026-07-09T20:00:00-04:00'),
      ),
    ).toBe(false)
  })

  it('is false for a missing value', () => {
    expect(isTodayLocal(null, new Date('2026-07-09T20:00:00-04:00'))).toBe(
      false,
    )
  })
})
