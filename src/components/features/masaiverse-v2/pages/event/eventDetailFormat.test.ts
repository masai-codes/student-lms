import { describe, expect, it } from 'vitest'
import {
  formatIstDateBadge,
  formatIstLongDate,
  formatIstTimeRange,
} from './eventDetailFormat'

// 2026-06-10T09:00:00Z → 2:30 PM IST on Wed 10 June.
const START = '2026-06-10T09:00:00Z'
const END = '2026-06-10T11:30:00Z'

describe('formatIstDateBadge', () => {
  it('builds an uppercase month + day badge in IST from the start', () => {
    expect(formatIstDateBadge(START, null)).toEqual({ month: 'JUN', day: '10' })
  })

  it('falls back to the end time when there is no start', () => {
    expect(formatIstDateBadge(null, END)).toEqual({ month: 'JUN', day: '10' })
  })

  it('returns null when both timestamps are missing or unparseable', () => {
    expect(formatIstDateBadge(null, null)).toBeNull()
    expect(formatIstDateBadge('not-a-date', null)).toBeNull()
  })
})

describe('formatIstLongDate', () => {
  it('formats the long IST date', () => {
    expect(formatIstLongDate(START, null)).toBe('Wednesday, 10 June 2026')
  })

  it('returns null without a usable timestamp', () => {
    expect(formatIstLongDate(null, null)).toBeNull()
  })
})

describe('formatIstTimeRange', () => {
  it('returns a range when both times are present', () => {
    expect(formatIstTimeRange(START, END)).toBe('2:30 PM – 5:00 PM')
  })

  it('returns a single start time when there is no end', () => {
    expect(formatIstTimeRange(START, null)).toBe('2:30 PM')
  })

  it('prefixes "Ends" when only the end time is present', () => {
    expect(formatIstTimeRange(null, END)).toBe('Ends 5:00 PM')
  })

  it('returns null when neither time is present', () => {
    expect(formatIstTimeRange(null, null)).toBeNull()
  })
})
