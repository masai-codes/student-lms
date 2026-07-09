import { describe, expect, it } from 'vitest'
import { getScheduleDateWindow } from '../scheduleWindow'

describe('getScheduleDateWindow', () => {
  it('spans [today - 1, today + 7] as IST YYYY-MM-DD bounds (1-day pad each side)', () => {
    // 06:30 UTC = 12:00 IST on 2026-07-02. Nominal grid is today … today+6
    // (07-02 … 07-08); the window is padded a day on each side for non-IST
    // viewers whose local-day grid is offset from IST.
    expect(getScheduleDateWindow(new Date('2026-07-02T06:30:00Z'))).toEqual({
      start: '2026-07-01',
      end: '2026-07-09',
    })
  })

  it('uses the IST date at the day boundary', () => {
    // 20:00 UTC Jul 2 = 01:30 IST Jul 3 → padded to [07-02, 07-10]
    expect(getScheduleDateWindow(new Date('2026-07-02T20:00:00Z'))).toEqual({
      start: '2026-07-02',
      end: '2026-07-10',
    })
  })
})
