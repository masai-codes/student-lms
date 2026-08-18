import { describe, expect, it } from 'vitest'
import { anchorDay, rangeTitle, shiftAnchor, visibleRange } from './calendarRange'

// 2026-08-14 is a Friday; locale week starts Sunday (dayjs default).
const ANCHOR = '2026-08-14'

describe('anchorDay', () => {
  it('falls back to today for invalid input', () => {
    expect(anchorDay('garbage').isSame(anchorDay(undefined))).toBe(true)
  })
})

describe('visibleRange', () => {
  it('returns the single day for day view', () => {
    expect(visibleRange('day', ANCHOR)).toEqual({
      start: '2026-08-14',
      end: '2026-08-14',
    })
  })

  it('returns the local week for week view', () => {
    expect(visibleRange('week', ANCHOR)).toEqual({
      start: '2026-08-09',
      end: '2026-08-15',
    })
  })

  it('returns the full 42-cell grid for month view', () => {
    // August 2026 starts on a Saturday → grid starts Sun 26 Jul.
    expect(visibleRange('month', ANCHOR)).toEqual({
      start: '2026-07-26',
      end: '2026-09-05',
    })
  })
})

describe('shiftAnchor', () => {
  it('moves by one unit per view', () => {
    expect(shiftAnchor('month', ANCHOR, 1)).toBe('2026-09-14')
    expect(shiftAnchor('week', ANCHOR, -1)).toBe('2026-08-07')
    expect(shiftAnchor('day', ANCHOR, 1)).toBe('2026-08-15')
  })
})

describe('rangeTitle', () => {
  it('formats each view', () => {
    expect(rangeTitle('month', ANCHOR)).toBe('August 2026')
    expect(rangeTitle('day', ANCHOR)).toBe('Fri, 14 Aug 2026')
    expect(rangeTitle('week', ANCHOR)).toBe('9 – 15 Aug 2026')
  })

  it('spells both months for a cross-month week', () => {
    // Week of Sun 30 Aug – Sat 5 Sep 2026.
    expect(rangeTitle('week', '2026-09-01')).toBe('30 Aug – 5 Sep 2026')
  })

  it('spells both years for a cross-year week', () => {
    // Week of Sun 27 Dec 2026 – Sat 2 Jan 2027.
    expect(rangeTitle('week', '2026-12-30')).toBe('27 Dec 2026 – 2 Jan 2027')
  })
})
