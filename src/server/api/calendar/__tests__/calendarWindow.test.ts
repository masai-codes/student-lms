import { describe, expect, it } from 'vitest'
import {
  MAX_CALENDAR_WINDOW_DAYS,
  padCalendarWindow,
  parseCalendarWindow,
} from '../calendarWindow'

describe('parseCalendarWindow', () => {
  it('accepts a valid ordered range', () => {
    expect(parseCalendarWindow('2026-08-10', '2026-08-16')).toEqual({
      start: '2026-08-10',
      end: '2026-08-16',
    })
  })

  it('accepts a single-day range', () => {
    expect(parseCalendarWindow('2026-08-14', '2026-08-14')).toEqual({
      start: '2026-08-14',
      end: '2026-08-14',
    })
  })

  it(`accepts the maximum span of ${MAX_CALENDAR_WINDOW_DAYS} days`, () => {
    // 31 days of January + 14 of February = 45 inclusive days.
    expect(() => parseCalendarWindow('2026-01-01', '2026-02-14')).not.toThrow()
  })

  it.each([
    [undefined, '2026-08-16'],
    ['2026-08-10', undefined],
    ['not-a-date', '2026-08-16'],
    ['2026-8-1', '2026-08-16'],
    ['2026-08-10', '10-08-2026'],
  ])('rejects malformed input %s / %s', (start, end) => {
    expect(() => parseCalendarWindow(start, end)).toThrow(
      'INVALID_CALENDAR_RANGE',
    )
  })

  it('rejects impossible rollover dates', () => {
    expect(() => parseCalendarWindow('2026-02-31', '2026-03-05')).toThrow(
      'INVALID_CALENDAR_RANGE',
    )
  })

  it('rejects an inverted range', () => {
    expect(() => parseCalendarWindow('2026-08-16', '2026-08-10')).toThrow(
      'INVALID_CALENDAR_RANGE',
    )
  })

  it('rejects a span longer than the cap', () => {
    expect(() => parseCalendarWindow('2026-01-01', '2026-03-01')).toThrow(
      'INVALID_CALENDAR_RANGE',
    )
  })
})

describe('padCalendarWindow', () => {
  it('widens by one day on each side, across month edges', () => {
    expect(
      padCalendarWindow({ start: '2026-08-01', end: '2026-08-31' }),
    ).toEqual({ start: '2026-07-31', end: '2026-09-01' })
  })
})
