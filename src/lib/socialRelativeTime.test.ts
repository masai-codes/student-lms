import { describe, expect, it } from 'vitest'
import { formatSocialPostTime } from './socialRelativeTime'

describe('formatSocialPostTime', () => {
  it('returns Just now for null, invalid, future, and under 60s', () => {
    const now = new Date('2026-04-12T15:00:00.000Z')
    expect(formatSocialPostTime(null, now)).toBe('Just now')
    expect(formatSocialPostTime('', now)).toBe('Just now')
    expect(formatSocialPostTime('not-a-date', now)).toBe('Just now')
    expect(formatSocialPostTime('2026-04-12T15:00:30.000Z', now)).toBe('Just now')
    expect(formatSocialPostTime('2026-04-12T16:00:00.000Z', now)).toBe('Just now')
  })

  it('uses minutes ago under 1 hour', () => {
    const now = new Date('2026-04-12T15:00:00.000Z')
    expect(formatSocialPostTime('2026-04-12T14:05:00.000Z', now)).toBe('55 minutes ago')
    expect(formatSocialPostTime('2026-04-12T14:59:00.000Z', now)).toBe('1 minute ago')
  })

  it('uses hours ago for same calendar day when under 6 hours elapsed', () => {
    const now = new Date('2026-04-12T22:00:00+05:30')
    expect(formatSocialPostTime('2026-04-12T20:00:00+05:30', now)).toBe('2 hours ago')
    expect(formatSocialPostTime('2026-04-12T21:00:00+05:30', now)).toBe('1 hour ago')
  })

  it('uses Today at for same calendar day when 6+ hours elapsed', () => {
    const now = new Date('2026-04-12T22:00:00+05:30')
    const out = formatSocialPostTime('2026-04-12T08:00:00+05:30', now)
    expect(out.startsWith('Today at ')).toBe(true)
  })

  it('uses Yesterday at for previous local calendar day', () => {
    const now = new Date('2026-04-12T15:00:00+05:30')
    const out = formatSocialPostTime('2026-04-11T10:30:00+05:30', now)
    expect(out.startsWith('Yesterday at ')).toBe(true)
  })

  it('uses date and time for older posts', () => {
    const now = new Date('2026-04-12T15:00:00+05:30')
    const out = formatSocialPostTime('2026-04-05T10:00:00+05:30', now)
    expect(out).not.toContain('Today')
    expect(out).not.toContain('Yesterday')
    expect(out).not.toContain('ago')
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })
})
