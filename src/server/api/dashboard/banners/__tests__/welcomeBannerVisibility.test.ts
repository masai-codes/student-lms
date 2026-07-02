import { describe, expect, it } from 'vitest'
import {
  buildBannerAnalyticsKey,
  getIstNowMs,
  getUserBannerGroup,
  isBannerVisibleToBatches,
  isBannerVisibleToGroup,
  isWithinBannerWindow,
  parseBannerVisibility,
  parseIstWallClock,
} from '../welcomeBannerVisibility'

describe('buildBannerAnalyticsKey', () => {
  it('prefers the group name', () => {
    expect(buildBannerAnalyticsKey('referral', 'promo', 'v1')).toBe('referral')
  })

  it('falls back to type_variant when there is no group', () => {
    expect(buildBannerAnalyticsKey(null, 'promo', 'v1')).toBe('promo_v1')
    expect(buildBannerAnalyticsKey('  ', 'promo', null)).toBe('promo')
    expect(buildBannerAnalyticsKey(null, null, null)).toBe('')
  })
})

describe('getUserBannerGroup', () => {
  it('maps userId % 4 to A/B/C/D', () => {
    expect(getUserBannerGroup(0)).toBe('A')
    expect(getUserBannerGroup(1)).toBe('B')
    expect(getUserBannerGroup(2)).toBe('C')
    expect(getUserBannerGroup(3)).toBe('D')
    expect(getUserBannerGroup(4)).toBe('A')
  })
})

describe('parseBannerVisibility', () => {
  it('parses a JSON string into string arrays', () => {
    expect(parseBannerVisibility('{"batches":[1,2],"random_group":["A"]}')).toEqual({
      batches: ['1', '2'],
      randomGroup: ['A'],
    })
  })

  it('accepts an already-parsed object', () => {
    expect(parseBannerVisibility({ batches: ['9'] })).toEqual({
      batches: ['9'],
      randomGroup: [],
    })
  })

  it('falls back to empty targeting for null/invalid/malformed input', () => {
    const empty = { batches: [], randomGroup: [] }
    expect(parseBannerVisibility(null)).toEqual(empty)
    expect(parseBannerVisibility('not json')).toEqual(empty)
    expect(parseBannerVisibility('123')).toEqual(empty)
  })
})

describe('isBannerVisibleToBatches', () => {
  it('is visible to everyone when no batches are targeted', () => {
    expect(isBannerVisibleToBatches({ batches: [], randomGroup: [] }, ['5'])).toBe(true)
  })

  it('is visible only when a targeted batch intersects the user batches', () => {
    expect(isBannerVisibleToBatches({ batches: ['5', '6'], randomGroup: [] }, ['6'])).toBe(true)
    expect(isBannerVisibleToBatches({ batches: ['5', '6'], randomGroup: [] }, ['9'])).toBe(false)
  })
})

describe('isBannerVisibleToGroup', () => {
  it('is visible to everyone when no group is targeted', () => {
    expect(isBannerVisibleToGroup({ batches: [], randomGroup: [] }, 'A')).toBe(true)
  })

  it('is visible only when the user group is listed', () => {
    expect(isBannerVisibleToGroup({ batches: [], randomGroup: ['A', 'B'] }, 'B')).toBe(true)
    expect(isBannerVisibleToGroup({ batches: [], randomGroup: ['A', 'B'] }, 'C')).toBe(false)
  })
})

describe('IST window', () => {
  it('shifts now by +5:30 and parses IST wall-clock datetimes into the same frame', () => {
    const utcNoon = Date.parse('2026-07-02T12:00:00Z')
    expect(getIstNowMs(utcNoon)).toBe(parseIstWallClock('2026-07-02 17:30:00'))
  })

  it('returns null for missing/invalid wall-clock values', () => {
    expect(parseIstWallClock(null)).toBeNull()
    expect(parseIstWallClock('nope')).toBeNull()
  })

  it('treats missing bounds as open on that side', () => {
    const now = parseIstWallClock('2026-07-02 12:00:00') as number
    expect(isWithinBannerWindow(null, null, now)).toBe(true)
    expect(isWithinBannerWindow('2026-07-01 00:00:00', null, now)).toBe(true)
    expect(isWithinBannerWindow(null, '2026-07-03 00:00:00', now)).toBe(true)
  })

  it('excludes banners before start or after end', () => {
    const now = parseIstWallClock('2026-07-02 12:00:00') as number
    expect(isWithinBannerWindow('2026-07-03 00:00:00', '2026-07-10 00:00:00', now)).toBe(false)
    expect(isWithinBannerWindow('2026-06-01 00:00:00', '2026-07-01 00:00:00', now)).toBe(false)
    expect(isWithinBannerWindow('2026-07-01 00:00:00', '2026-07-10 00:00:00', now)).toBe(true)
  })
})
