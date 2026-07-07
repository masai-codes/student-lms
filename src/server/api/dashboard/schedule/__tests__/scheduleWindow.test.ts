import { describe, expect, it } from 'vitest'
import { getScheduleDateWindow } from '../scheduleWindow'

describe('getScheduleDateWindow', () => {
  it('spans today to today + 7 days as IST YYYY-MM-DD bounds', () => {
    // 06:30 UTC = 12:00 IST on 2026-07-02 → today … today+6
    expect(getScheduleDateWindow(new Date('2026-07-02T06:30:00Z'))).toEqual({
      start: '2026-07-02',
      end: '2026-07-08',
    })
  })

  it('uses the IST date at the day boundary', () => {
    // 20:00 UTC Jul 2 = 01:30 IST Jul 3
    expect(getScheduleDateWindow(new Date('2026-07-02T20:00:00Z'))).toEqual({
      start: '2026-07-03',
      end: '2026-07-09',
    })
  })
})
