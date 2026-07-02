// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeNextBannerIndex, nextRotatedBannerIndex } from './bannerRotation'

describe('computeNextBannerIndex', () => {
  it('starts at 0 for a null/invalid last index or empty list', () => {
    expect(computeNextBannerIndex(null, 3)).toBe(0)
    expect(computeNextBannerIndex(-1, 3)).toBe(0)
    expect(computeNextBannerIndex(1.5, 3)).toBe(0)
    expect(computeNextBannerIndex(2, 0)).toBe(0)
  })

  it('advances one step and wraps around', () => {
    expect(computeNextBannerIndex(0, 3)).toBe(1)
    expect(computeNextBannerIndex(1, 3)).toBe(2)
    expect(computeNextBannerIndex(2, 3)).toBe(0)
  })
})

describe('nextRotatedBannerIndex', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('advances and persists the index across calls', () => {
    expect(nextRotatedBannerIndex(3)).toBe(0)
    expect(nextRotatedBannerIndex(3)).toBe(1)
    expect(nextRotatedBannerIndex(3)).toBe(2)
    expect(nextRotatedBannerIndex(3)).toBe(0)
  })

  it('returns 0 without touching storage for an empty list', () => {
    expect(nextRotatedBannerIndex(0)).toBe(0)
  })

  it('falls back to 0 when storage reads throw', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(nextRotatedBannerIndex(3)).toBe(0)
  })
})
