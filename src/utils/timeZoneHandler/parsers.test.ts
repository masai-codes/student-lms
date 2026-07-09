import { describe, expect, it } from 'vitest'
import { parseMasaiverseEventDbTimestamp, parseServerTimestamp } from './index'

describe('parseServerTimestamp (UTC with far-future → local fallback)', () => {
  it('parses timezone-aware values directly', () => {
    const parsed = parseServerTimestamp('2026-04-14T10:00:00.000Z')
    expect(parsed?.toISOString()).toBe('2026-04-14T10:00:00.000Z')
  })

  it('treats timezone-less SQL timestamps as UTC by default', () => {
    const parsed = parseServerTimestamp('2026-04-14 10:00:00', {
      nowMs: new Date('2026-04-14T10:30:00.000Z').getTime(),
    })
    expect(parsed?.toISOString()).toBe('2026-04-14T10:00:00.000Z')
  })

  it('falls back to local parse when UTC assumption is far future', () => {
    const parsed = parseServerTimestamp('2026-04-14 15:30:00', {
      nowMs: new Date('2026-04-14T10:00:00.000Z').getTime(),
      futureSkewMs: 30 * 60 * 1000,
    })
    expect(parsed).not.toBeNull()
    expect(Number.isNaN(parsed!.getTime())).toBe(false)
  })

  it('returns null for nullish/invalid values', () => {
    expect(parseServerTimestamp(null)).toBeNull()
    expect(parseServerTimestamp(undefined)).toBeNull()
    expect(parseServerTimestamp('not-a-date')).toBeNull()
  })
})

describe('parseMasaiverseEventDbTimestamp (strict UTC, no future fallback)', () => {
  it('parses timezone-aware values directly', () => {
    const parsed = parseMasaiverseEventDbTimestamp('2026-04-14T10:00:00.000Z')
    expect(parsed?.toISOString()).toBe('2026-04-14T10:00:00.000Z')
  })

  it('always reads a naive value as UTC, even far in the future', () => {
    // A future event must NOT be shifted to local — this is the whole reason it
    // does not share parseServerTimestamp's fallback.
    const parsed = parseMasaiverseEventDbTimestamp('2099-04-21 08:30:00')
    expect(parsed?.toISOString()).toBe('2099-04-21T08:30:00.000Z')
  })

  it('returns null for nullish/invalid values', () => {
    expect(parseMasaiverseEventDbTimestamp(null)).toBeNull()
    expect(parseMasaiverseEventDbTimestamp('   ')).toBeNull()
    expect(parseMasaiverseEventDbTimestamp('not-a-date')).toBeNull()
  })
})
