import { describe, expect, it } from 'vitest'
import { computeMigratedFeedbackRating } from '@/server/api/ai-tutor/migrateFeedbackRating'

describe('computeMigratedFeedbackRating', () => {
  it('subtracts 1 for ios and android platform prefixes', () => {
    expect(computeMigratedFeedbackRating(6, 'ios')).toEqual({
      kind: 'updated',
      rating: 5,
      previousRating: 6,
    })
    expect(computeMigratedFeedbackRating(3, 'android-Great')).toEqual({
      kind: 'updated',
      rating: 2,
      previousRating: 3,
    })
  })

  it('skips mobile rows that would drop below 1', () => {
    expect(computeMigratedFeedbackRating(1, 'ios')).toEqual({
      kind: 'skipped',
      rating: 1,
      reason: 'MOBILE_RATING_BELOW_MIN',
    })
  })

  it('converts legacy binary ratings without a platform prefix', () => {
    expect(computeMigratedFeedbackRating(0, null)).toEqual({
      kind: 'updated',
      rating: 1,
      previousRating: 0,
    })
    expect(computeMigratedFeedbackRating(1, 'Helpful')).toEqual({
      kind: 'updated',
      rating: 5,
      previousRating: 1,
    })
  })

  it('leaves prefixed web-like ratings unchanged', () => {
    expect(computeMigratedFeedbackRating(1, 'web')).toEqual({
      kind: 'unchanged',
      rating: 1,
    })
    expect(computeMigratedFeedbackRating(0, 'app-Nice')).toEqual({
      kind: 'unchanged',
      rating: 0,
    })
  })

  it('leaves unrelated ratings unchanged', () => {
    expect(computeMigratedFeedbackRating(4, 'ios-Great')).toEqual({
      kind: 'updated',
      rating: 3,
      previousRating: 4,
    })
    expect(computeMigratedFeedbackRating(3, 'legacy feedback')).toEqual({
      kind: 'unchanged',
      rating: 3,
    })
  })
})
