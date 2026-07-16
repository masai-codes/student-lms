import { describe, expect, it } from 'vitest'

import {
  computeLectureHeroHeightPx,
  getStableHeroRootTopPx,
  MIN_LECTURE_HERO_HEIGHT_PX,
  sumElementOffsetHeights,
} from '../lectureViewportLayout'

describe('computeLectureHeroHeightPx', () => {
  it('subtracts chrome rows from the viewport slice', () => {
    expect(
      computeLectureHeroHeightPx({
        viewportHeight: 900,
        rootTop: 80,
        mobileTabBarHeightPx: 0,
        reservedChromePx: 220,
      }),
    ).toBe(600)
  })

  it('subtracts the mobile app tab bar from available height', () => {
    expect(
      computeLectureHeroHeightPx({
        viewportHeight: 900,
        rootTop: 80,
        mobileTabBarHeightPx: 72,
        reservedChromePx: 220,
      }),
    ).toBe(528)
  })

  it('never goes below the minimum hero height', () => {
    expect(
      computeLectureHeroHeightPx({
        viewportHeight: 400,
        rootTop: 80,
        mobileTabBarHeightPx: 72,
        reservedChromePx: 320,
      }),
    ).toBe(MIN_LECTURE_HERO_HEIGHT_PX)
  })
})

describe('getStableHeroRootTopPx', () => {
  it('keeps the layout offset stable after the user scrolls', () => {
    const root = {
      getBoundingClientRect: () => ({ top: -320 }),
    } as HTMLElement

    expect(getStableHeroRootTopPx(root, 400)).toBe(80)
  })
})

describe('sumElementOffsetHeights', () => {
  it('sums offset heights for chrome measurement', () => {
    const elements = [
      { offsetHeight: 120 },
      { offsetHeight: 72 },
    ] as Array<HTMLElement>

    expect(sumElementOffsetHeights(elements)).toBe(192)
  })
})
