import { describe, expect, it } from 'vitest'
import { driverWallClock, toDbWallClock, toEpochMs } from './columnTypes'

const IST = 5 * 60 + 30
const UTC = 0

// Reference instant: 2026-07-09 03:20:00 IST === 2026-07-08 21:50:00 UTC.
const IST_WALL = '2026-07-09 03:20:00'
const UTC_INSTANT_MS = Date.parse('2026-07-08T21:50:00Z')

describe('driverWallClock', () => {
  it('passes through a naive string, normalizing the separator', () => {
    expect(driverWallClock('2026-07-09 03:20:00')).toBe('2026-07-09T03:20:00')
  })

  it('strips an existing zone suffix', () => {
    expect(driverWallClock('2026-07-09T03:20:00+05:30')).toBe(
      '2026-07-09T03:20:00',
    )
    expect(driverWallClock('2026-07-09T03:20:00Z')).toBe('2026-07-09T03:20:00')
  })

  it('reads wall-clock digits from a Date via its UTC components', () => {
    // mysql2 builds this Date by reading the naive string in the UTC session.
    const d = new Date('2026-07-09T03:20:00Z')
    expect(driverWallClock(d)).toBe('2026-07-09T03:20:00')
  })

  it('keeps fractional seconds when present', () => {
    expect(driverWallClock(new Date('2026-07-09T03:20:00.123Z'))).toBe(
      '2026-07-09T03:20:00.123',
    )
  })
})

describe('read path (fromDriver equivalents)', () => {
  it('stamps IST datetime with +05:30 → correct absolute instant', () => {
    const iso = `${driverWallClock(IST_WALL)}+05:30`
    expect(iso).toBe('2026-07-09T03:20:00+05:30')
    // The whole point: naive new Date() now lands on the right instant.
    expect(new Date(iso).getTime()).toBe(UTC_INSTANT_MS)
  })

  it('stamps UTC timestamp with Z → correct absolute instant', () => {
    const iso = `${driverWallClock('2026-07-08 21:50:00')}Z`
    expect(iso).toBe('2026-07-08T21:50:00Z')
    expect(new Date(iso).getTime()).toBe(UTC_INSTANT_MS)
  })

  it('the two conventions on the SAME digits resolve 5.5h apart', () => {
    const digits = '2026-07-09 03:20:00'
    const asIst = new Date(`${driverWallClock(digits)}+05:30`).getTime()
    const asUtc = new Date(`${driverWallClock(digits)}Z`).getTime()
    expect(asUtc - asIst).toBe(IST * 60_000)
  })
})

describe('toEpochMs', () => {
  it('interprets a naive string in the column zone', () => {
    expect(toEpochMs(IST_WALL, IST)).toBe(UTC_INSTANT_MS)
    expect(toEpochMs('2026-07-08 21:50:00', UTC)).toBe(UTC_INSTANT_MS)
  })

  it('trusts an explicit offset regardless of column zone', () => {
    expect(toEpochMs('2026-07-08T21:50:00Z', IST)).toBe(UTC_INSTANT_MS)
    expect(toEpochMs('2026-07-09T03:20:00+05:30', UTC)).toBe(UTC_INSTANT_MS)
  })

  it('treats a Date as an absolute instant', () => {
    expect(toEpochMs(new Date(UTC_INSTANT_MS), IST)).toBe(UTC_INSTANT_MS)
  })
})

describe('write path (toDriver equivalents) round-trips', () => {
  it('IST: naive wall-clock stays put', () => {
    expect(toDbWallClock(toEpochMs(IST_WALL, IST), IST)).toBe(
      '2026-07-09 03:20:00',
    )
  })

  it('IST: a UTC instant is converted to IST wall-clock for storage', () => {
    expect(toDbWallClock(toEpochMs('2026-07-08T21:50:00Z', IST), IST)).toBe(
      '2026-07-09 03:20:00',
    )
  })

  it('UTC: an IST-offset instant is converted to UTC wall-clock for storage', () => {
    expect(
      toDbWallClock(toEpochMs('2026-07-09T03:20:00+05:30', UTC), UTC),
    ).toBe('2026-07-08 21:50:00')
  })

  it('UTC: a Date stores its UTC wall-clock', () => {
    expect(toDbWallClock(new Date('2026-07-08T21:50:00Z').getTime(), UTC)).toBe(
      '2026-07-08 21:50:00',
    )
  })
})
