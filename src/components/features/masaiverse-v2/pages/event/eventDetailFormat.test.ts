import { describe, expect, it } from 'vitest'
import {
  formatLocalDateBadge,
  formatLocalLongDate,
  formatLocalSchedule,
  formatLocalTimeRange,
} from './eventDetailFormat'

// Pin the timezone so the viewer-local formatters produce deterministic output
// regardless of the machine/CI timezone. Asia/Kolkata → getTzLabel() === 'IST'.
process.env.TZ = 'Asia/Kolkata'

// 2026-06-10T09:00:00Z → 2:30 PM IST on Wed 10 June.
const START = '2026-06-10T09:00:00Z'
const END = '2026-06-10T11:30:00Z'

describe('formatLocalDateBadge', () => {
  it('builds an uppercase month + day badge from the start', () => {
    expect(formatLocalDateBadge(START, null)).toEqual({
      month: 'JUN',
      day: '10',
    })
  })

  it('falls back to the end time when there is no start', () => {
    expect(formatLocalDateBadge(null, END)).toEqual({ month: 'JUN', day: '10' })
  })

  it('returns null when both timestamps are missing or unparseable', () => {
    expect(formatLocalDateBadge(null, null)).toBeNull()
    expect(formatLocalDateBadge('not-a-date', null)).toBeNull()
  })
})

describe('formatLocalLongDate', () => {
  it('formats the long date', () => {
    expect(formatLocalLongDate(START, null)).toBe('Wednesday, 10 June 2026')
  })

  it('returns null without a usable timestamp', () => {
    expect(formatLocalLongDate(null, null)).toBeNull()
  })
})

describe('formatLocalTimeRange', () => {
  it('returns a range when both times are present', () => {
    expect(formatLocalTimeRange(START, END)).toBe('2:30 PM – 5:00 PM')
  })

  it('returns a single start time when there is no end', () => {
    expect(formatLocalTimeRange(START, null)).toBe('2:30 PM')
  })

  it('prefixes "Ends" when only the end time is present', () => {
    expect(formatLocalTimeRange(null, END)).toBe('Ends 5:00 PM')
  })

  it('returns null when neither time is present', () => {
    expect(formatLocalTimeRange(null, null)).toBeNull()
  })
})

describe('formatLocalSchedule', () => {
  it('uses the long-date + time-range layout for a single-day event', () => {
    expect(formatLocalSchedule(START, END)).toEqual({
      dateLine: 'Wednesday, 10 June 2026',
      timeLine: '2:30 PM – 5:00 PM (IST)',
    })
  })

  it('shows both full instants for a multi-day event', () => {
    expect(formatLocalSchedule(START, '2026-06-12T06:00:00Z')).toEqual({
      dateLine: 'Wed, 10 Jun 2026, 2:30 PM',
      timeLine: 'to Fri, 12 Jun 2026, 11:30 AM (IST)',
    })
  })

  it('keeps a single time when only the start is present', () => {
    expect(formatLocalSchedule(START, null)).toEqual({
      dateLine: 'Wednesday, 10 June 2026',
      timeLine: '2:30 PM (IST)',
    })
  })

  it('returns null lines when no timestamps are present', () => {
    expect(formatLocalSchedule(null, null)).toEqual({
      dateLine: null,
      timeLine: null,
    })
  })
})
