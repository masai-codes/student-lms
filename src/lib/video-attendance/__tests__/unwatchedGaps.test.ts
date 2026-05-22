import { describe, expect, it } from 'vitest'

import { unwatchedGaps } from '../unwatchedGaps'

describe('unwatchedGaps', () => {
  it('returns full timeline when no merged intervals', () => {
    expect(unwatchedGaps([], 100)).toEqual([{ start: 0, end: 100 }])
  })

  it('returns gaps between watched segments', () => {
    expect(
      unwatchedGaps(
        [
          { start: 10, end: 20 },
          { start: 40, end: 50 },
        ],
        60,
      ),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 40 },
      { start: 50, end: 60 },
    ])
  })
})
