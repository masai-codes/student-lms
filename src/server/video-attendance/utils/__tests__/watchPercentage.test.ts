import { describe, expect, it } from 'vitest'

import {
  calculateVideoWatchDurationPercentage,
  mergeIntervals,
  mergeIntervalsWithTolerance,
  parseStoredIntervals,
} from '../watchPercentage'

describe('mergeIntervals', () => {
  it('collapses overlapping and touching intervals', () => {
    expect(
      mergeIntervals([
        { start: 0, end: 30 },
        { start: 20, end: 40 },
        { start: 40, end: 50 },
      ]),
    ).toEqual([{ start: 0, end: 50 }])
  })

  it('keeps disjoint intervals separate and sorts them', () => {
    expect(
      mergeIntervals([
        { start: 60, end: 70 },
        { start: 0, end: 10 },
      ]),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 60, end: 70 },
    ])
  })
})

describe('calculateVideoWatchDurationPercentage', () => {
  it('sums per-interval rounded percentages', () => {
    expect(
      calculateVideoWatchDurationPercentage([{ start: 0, end: 50 }], 100),
    ).toBe(50)
  })

  it('caps at 100', () => {
    expect(
      calculateVideoWatchDurationPercentage(
        [
          { start: 0, end: 80 },
          { start: 80, end: 160 },
        ],
        100,
      ),
    ).toBe(100)
  })

  it('returns 0 for a non-positive totalDuration', () => {
    expect(calculateVideoWatchDurationPercentage([{ start: 0, end: 10 }], 0)).toBe(0)
  })
})

describe('mergeIntervalsWithTolerance', () => {
  it('bridges gaps <= 2s but keeps larger skips visible', () => {
    expect(
      mergeIntervalsWithTolerance([
        { start: 0, end: 30 },
        { start: 31, end: 40 }, // 1s gap -> merged
        { start: 60, end: 70 }, // 20s gap -> separate
      ]),
    ).toEqual([
      { start: 0, end: 40 },
      { start: 60, end: 70 },
    ])
  })

  it('returns [] for non-array input', () => {
    expect(mergeIntervalsWithTolerance(null)).toEqual([])
  })
})

describe('parseStoredIntervals', () => {
  it('parses a JSON string column', () => {
    expect(parseStoredIntervals('[{"start":0,"end":5}]')).toEqual([
      { start: 0, end: 5 },
    ])
  })

  it('drops malformed segments', () => {
    expect(
      parseStoredIntervals([
        { start: 0, end: 5 },
        { start: 5, end: 3 }, // end < start
        { start: 'x', end: 9 },
      ]),
    ).toEqual([{ start: 0, end: 5 }])
  })
})
