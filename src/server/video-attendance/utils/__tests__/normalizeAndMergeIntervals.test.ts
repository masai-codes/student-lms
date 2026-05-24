import { describe, expect, it } from 'vitest'

import { normalizeAndMergeIntervals } from '../normalizeAndMergeIntervals'

describe('normalizeAndMergeIntervals', () => {
  it('returns empty array for invalid input', () => {
    expect(normalizeAndMergeIntervals(null, 100)).toEqual([])
    expect(normalizeAndMergeIntervals([{ start: 1, end: 1 }], 100)).toEqual([])
  })

  it('merges overlapping and adjacent intervals', () => {
    expect(
      normalizeAndMergeIntervals(
        [
          { start: 0, end: 10 },
          { start: 8, end: 20 },
          { start: 25, end: 30 },
        ],
        60,
      ),
    ).toEqual([
      { start: 0, end: 20 },
      { start: 25, end: 30 },
    ])
  })

  it('clamps intervals to total duration', () => {
    expect(
      normalizeAndMergeIntervals([{ start: 50, end: 120 }], 100),
    ).toEqual([{ start: 50, end: 100 }])
  })
})
