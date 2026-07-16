// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeNextBannerIndex,
  nextRotatedBannerIndex,
  rememberBannerId,
} from './bannerRotation'

describe('computeNextBannerIndex', () => {
  it('starts at 0 for a null/unknown last id or empty list', () => {
    expect(computeNextBannerIndex(null, [10, 20, 30])).toBe(0)
    expect(computeNextBannerIndex(99, [10, 20, 30])).toBe(0)
    expect(computeNextBannerIndex(10, [])).toBe(0)
  })

  it('advances one past the last shown id and wraps around', () => {
    expect(computeNextBannerIndex(10, [10, 20, 30])).toBe(1)
    expect(computeNextBannerIndex(20, [10, 20, 30])).toBe(2)
    expect(computeNextBannerIndex(30, [10, 20, 30])).toBe(0)
  })
})

describe('nextRotatedBannerIndex / rememberBannerId', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('advances one past the remembered banner id', () => {
    rememberBannerId(20)
    expect(nextRotatedBannerIndex([10, 20, 30])).toBe(2)
  })

  it('starts at 0 with no stored id and for an empty list', () => {
    expect(nextRotatedBannerIndex([10, 20, 30])).toBe(0)
    rememberBannerId(20)
    expect(nextRotatedBannerIndex([])).toBe(0)
  })

  it('falls back to 0 when storage reads throw', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(nextRotatedBannerIndex([10, 20, 30])).toBe(0)
  })
})
