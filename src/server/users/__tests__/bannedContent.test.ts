import { describe, expect, it } from 'vitest'
import {
  getBannedContentCutoff,
  isBannedUser,
  isContentWithinBannedCutoff,
} from '../bannedContent'

describe('isBannedUser', () => {
  it('is true only when status is exactly "banned"', () => {
    expect(isBannedUser({ status: 'banned', statusTime: null })).toBe(true)
    expect(isBannedUser({ status: 'active', statusTime: null })).toBe(false)
    expect(isBannedUser(null)).toBe(false)
    expect(isBannedUser(undefined)).toBe(false)
  })
})

describe('getBannedContentCutoff', () => {
  it('returns null when the user is not banned', () => {
    expect(getBannedContentCutoff({ status: 'active', statusTime: '2026-01-01' })).toBeNull()
  })

  it('returns null when a banned user has no status time', () => {
    expect(getBannedContentCutoff({ status: 'banned', statusTime: null })).toBeNull()
  })

  it('returns null when the status time is invalid', () => {
    expect(getBannedContentCutoff({ status: 'banned', statusTime: 'not-a-date' })).toBeNull()
  })

  it('returns the cutoff date for a banned user with a valid status time', () => {
    const cutoff = getBannedContentCutoff({ status: 'banned', statusTime: '2026-05-01T00:00:00Z' })
    expect(cutoff?.toISOString()).toBe('2026-05-01T00:00:00.000Z')
  })
})

describe('isContentWithinBannedCutoff', () => {
  const cutoff = new Date('2026-05-01T00:00:00Z')

  it('allows everything when there is no cutoff', () => {
    expect(isContentWithinBannedCutoff({ createdAt: '2030-01-01' }, null)).toBe(true)
  })

  it('hides content created after the cutoff', () => {
    expect(
      isContentWithinBannedCutoff({ createdAt: '2026-06-01T00:00:00Z' }, cutoff),
    ).toBe(false)
  })

  it('hides content that starts after the cutoff even if created before', () => {
    expect(
      isContentWithinBannedCutoff(
        { createdAt: '2026-04-01T00:00:00Z', startDate: '2026-06-01T00:00:00Z' },
        cutoff,
      ),
    ).toBe(false)
  })

  it('allows content created and started on/before the cutoff', () => {
    expect(
      isContentWithinBannedCutoff(
        { createdAt: '2026-04-01T00:00:00Z', startDate: '2026-04-15T00:00:00Z' },
        cutoff,
      ),
    ).toBe(true)
  })

  it('ignores invalid/missing dates', () => {
    expect(
      isContentWithinBannedCutoff({ createdAt: null, startDate: 'bad-date' }, cutoff),
    ).toBe(true)
  })
})
