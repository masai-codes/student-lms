import { describe, expect, it } from 'vitest'

import {
  DISCUSSION_FEEDBACK_DATA_KEY,
  readFeedbackRating,
  tinyintToBool,
  toDiscussionListItem,
  truncateDiscussionPreview,
} from '@/server/new-discussions/utils/discussionPresentation'

describe('discussionPresentation', () => {
  it('tinyintToBool handles common truthy forms', () => {
    expect(tinyintToBool(1)).toBe(true)
    expect(tinyintToBool(true)).toBe(true)
    expect(tinyintToBool('1')).toBe(true)
    expect(tinyintToBool(0)).toBe(false)
    expect(tinyintToBool(false)).toBe(false)
  })

  it('truncateDiscussionPreview adds ellipsis when needed', () => {
    const long = 'a'.repeat(200)
    const out = truncateDiscussionPreview(long, 180)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(180)
  })

  it('toDiscussionListItem maps row, thread count, unread and feedback', () => {
    const item = toDiscussionListItem(
      {
        id: 9,
        title: 'Help',
        message: 'Body text here',
        isClosed: 0,
        public: 1,
        data: { [DISCUSSION_FEEDBACK_DATA_KEY]: { rating: 4 } },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        authorId: 3,
        authorName: 'Sam',
      },
      4,
      [],
      2,
    )
    expect(item.id).toBe(9)
    expect(item.threadCount).toBe(4)
    expect(item.unreadReplyCount).toBe(2)
    expect(item.feedbackRating).toBe(4)
    expect(item.isClosed).toBe(false)
    expect(item.author?.name).toBe('Sam')
    expect(item.messagePreview.length).toBeGreaterThan(0)
    expect(item.threads).toEqual([])
  })

  it('toDiscussionListItem defaults unread to 0 and feedback to null', () => {
    const item = toDiscussionListItem(
      {
        id: 1,
        title: 'T',
        message: 'M',
        isClosed: 0,
        public: 1,
        data: null,
        createdAt: null,
        updatedAt: null,
        authorId: 3,
        authorName: null,
      },
      0,
    )
    expect(item.unreadReplyCount).toBe(0)
    expect(item.feedbackRating).toBeNull()
    expect(item.author?.name).toBeNull()
  })

  it('readFeedbackRating ignores malformed feedback', () => {
    expect(readFeedbackRating(null)).toBeNull()
    expect(readFeedbackRating({})).toBeNull()
    expect(
      readFeedbackRating({ [DISCUSSION_FEEDBACK_DATA_KEY]: 'nope' }),
    ).toBeNull()
    expect(
      readFeedbackRating({ [DISCUSSION_FEEDBACK_DATA_KEY]: { rating: 'x' } }),
    ).toBeNull()
    expect(
      readFeedbackRating({ [DISCUSSION_FEEDBACK_DATA_KEY]: { rating: 5 } }),
    ).toBe(5)
  })
})
