import { describe, expect, it } from 'vitest'

import { parseDiscussionFeedbackInput } from '../validateDiscussionFeedbackInput'

describe('parseDiscussionFeedbackInput', () => {
  it('accepts a valid rating with no comment', () => {
    expect(parseDiscussionFeedbackInput({ rating: 4 })).toEqual({
      rating: 4,
      comment: null,
    })
  })

  it('trims a comment and keeps it', () => {
    expect(
      parseDiscussionFeedbackInput({ rating: 5, comment: '  great  ' }),
    ).toEqual({
      rating: 5,
      comment: 'great',
    })
  })

  it('coerces a blank comment to null', () => {
    expect(parseDiscussionFeedbackInput({ rating: 3, comment: '   ' })).toEqual(
      {
        rating: 3,
        comment: null,
      },
    )
  })

  it.each([0, 6, 2.5, Number.NaN, '4', null])(
    'rejects invalid rating %p',
    (rating) => {
      expect(() => parseDiscussionFeedbackInput({ rating })).toThrow(
        'INVALID_FEEDBACK_PAYLOAD',
      )
    },
  )

  it('rejects a non-string comment', () => {
    expect(() =>
      parseDiscussionFeedbackInput({ rating: 3, comment: 5 }),
    ).toThrow('INVALID_FEEDBACK_PAYLOAD')
  })

  it('rejects an over-long comment', () => {
    expect(() =>
      parseDiscussionFeedbackInput({ rating: 3, comment: 'a'.repeat(1001) }),
    ).toThrow('INVALID_FEEDBACK_PAYLOAD')
  })
})
