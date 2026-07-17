import { describe, expect, it } from 'vitest'
import {
  buildBannerAnalyticsKey,
  getUserBannerGroup,
  isBannerVisibleToBatches,
  isBannerVisibleToGroup,
  isNonMasaiVerseBanner,
  isWithinBannerWindow,
  parseBannerInstant,
  parseBannerVisibility,
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
    expect(
      parseBannerVisibility('{"batches":[1,2],"random_group":["A"]}'),
    ).toEqual({
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
  it('reaches nobody when no batches are targeted (old-LMS parity)', () => {
    expect(
      isBannerVisibleToBatches({ batches: [], randomGroup: [] }, ['5']),
    ).toBe(false)
  })

  it('is visible only when a targeted batch intersects the user batches', () => {
    expect(
      isBannerVisibleToBatches({ batches: ['5', '6'], randomGroup: [] }, ['6']),
    ).toBe(true)
    expect(
      isBannerVisibleToBatches({ batches: ['5', '6'], randomGroup: [] }, ['9']),
    ).toBe(false)
  })
})

describe('isBannerVisibleToGroup', () => {
  it('reaches nobody when no group is targeted (old-LMS parity)', () => {
    expect(isBannerVisibleToGroup({ batches: [], randomGroup: [] }, 'A')).toBe(
      false,
    )
  })

  it('is visible only when the user group is listed', () => {
    expect(
      isBannerVisibleToGroup({ batches: [], randomGroup: ['A', 'B'] }, 'B'),
    ).toBe(true)
    expect(
      isBannerVisibleToGroup({ batches: [], randomGroup: ['A', 'B'] }, 'C'),
    ).toBe(false)
  })
})

describe('isNonMasaiVerseBanner', () => {
  it('shows only banners whose settings.isMasaiVerse is explicitly false', () => {
    expect(isNonMasaiVerseBanner({ isMasaiVerse: false })).toBe(true)
    expect(isNonMasaiVerseBanner('{"isMasaiVerse":false}')).toBe(true)
  })

  it('hides Masaiverse, missing-flag, missing-settings and malformed banners', () => {
    expect(isNonMasaiVerseBanner({ isMasaiVerse: true })).toBe(false)
    expect(isNonMasaiVerseBanner({})).toBe(false)
    expect(isNonMasaiVerseBanner(null)).toBe(false)
    expect(isNonMasaiVerseBanner('not json')).toBe(false)
  })
})

describe('parseBannerInstant', () => {
  // The driver returns zoned strings; appending a bare "Z" to those used to
  // yield Invalid Date, which made every banner's window unbounded.
  it('parses an already-zoned datetime as an absolute instant', () => {
    expect(parseBannerInstant('2026-05-07T20:40:00+05:30')).toBe(
      Date.parse('2026-05-07T15:10:00Z'),
    )
    expect(parseBannerInstant('2026-05-07T15:10:00Z')).toBe(
      Date.parse('2026-05-07T15:10:00Z'),
    )
  })

  it('treats a naive datetime as IST wall-clock', () => {
    expect(parseBannerInstant('2026-05-07 20:40:00')).toBe(
      Date.parse('2026-05-07T15:10:00Z'),
    )
  })

  it('returns null for missing/invalid values', () => {
    expect(parseBannerInstant(null)).toBeNull()
    expect(parseBannerInstant('')).toBeNull()
    expect(parseBannerInstant('nope')).toBeNull()
  })
})

describe('isWithinBannerWindow', () => {
  const now = Date.parse('2026-07-02T12:00:00Z')

  it('hides banners with a missing bound (old-LMS parity)', () => {
    expect(isWithinBannerWindow(null, null, now)).toBe(false)
    expect(isWithinBannerWindow('2026-07-01T00:00:00Z', null, now)).toBe(false)
    expect(isWithinBannerWindow(null, '2026-07-03T00:00:00Z', now)).toBe(false)
  })

  it('excludes banners before start or after end', () => {
    expect(
      isWithinBannerWindow('2026-07-03T00:00:00Z', '2026-07-10T00:00:00Z', now),
    ).toBe(false)
    expect(
      isWithinBannerWindow('2026-06-01T00:00:00Z', '2026-07-01T00:00:00Z', now),
    ).toBe(false)
    expect(
      isWithinBannerWindow('2026-07-01T00:00:00Z', '2026-07-10T00:00:00Z', now),
    ).toBe(true)
  })

  it('works with the zoned strings the driver actually returns', () => {
    // 2026-10-15T23:59+05:30 is still in the future relative to `now`.
    expect(
      isWithinBannerWindow(
        '2026-05-07T20:40:00+05:30',
        '2026-10-15T23:59:00+05:30',
        now,
      ),
    ).toBe(true)
  })
})
