import { describe, expect, it } from 'vitest'
import { parseServerTimestamp } from './parseServerTimestamp'

describe('parseServerTimestamp', () => {
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
