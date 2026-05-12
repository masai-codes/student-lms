import { describe, expect, it } from 'vitest'

import {
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

  it('toDiscussionListItem maps row and thread count', () => {
    const item = toDiscussionListItem(
      {
        id: 9,
        title: 'Help',
        message: 'Body text here',
        isClosed: 0,
        public: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        authorId: 3,
        authorName: 'Sam',
      },
      4
    )
    expect(item.id).toBe(9)
    expect(item.threadCount).toBe(4)
    expect(item.isClosed).toBe(false)
    expect(item.author?.name).toBe('Sam')
    expect(item.messagePreview.length).toBeGreaterThan(0)
  })
})
