import { describe, expect, it } from 'vitest'
import { getIstNowSqlDatetime } from '../istClock'

describe('getIstNowSqlDatetime', () => {
  it('shifts UTC by +5:30 and formats as a MySQL datetime string', () => {
    expect(getIstNowSqlDatetime(new Date('2026-07-02T06:30:00Z'))).toBe('2026-07-02 12:00:00')
  })

  it('rolls the date forward across midnight IST', () => {
    expect(getIstNowSqlDatetime(new Date('2026-07-02T20:00:00Z'))).toBe('2026-07-03 01:30:00')
  })
})
