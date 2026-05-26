import { describe, expect, it } from 'vitest'

import { mapDiscussionToLectureView } from '../mapDiscussionToLectureView'

import type { DiscussionListItem } from '@/server/learn/types'

const now = new Date('2026-05-20T15:00:00.000Z')

describe('mapDiscussionToLectureView', () => {
  it('maps API rows to comment view fields', () => {
    const row: DiscussionListItem = {
      id: 10,
      title: 'Help with pointers',
      messagePreview: '<p>Can someone explain?</p>',
      isClosed: false,
      isPublic: true,
      createdAt: '2026-05-20T12:00:00.000Z',
      updatedAt: '2026-05-20T12:00:00.000Z',
      threadCount: 3,
      threads: [],
      author: { id: 1, name: 'Priya Sharma' },
    }

    const view = mapDiscussionToLectureView(row, now)

    expect(view.id).toBe(10)
    expect(view.title).toBe('Help with pointers')
    expect(view.authorName).toBe('Priya Sharma')
    expect(view.authorInitials).toBe('PS')
    expect(view.replyCount).toBe(3)
    expect(view.postedAtLabel.length).toBeGreaterThan(0)
  })

  it('falls back when author is missing', () => {
    const view = mapDiscussionToLectureView(
      {
        id: 2,
        title: 'Question',
        messagePreview: 'Body',
        isClosed: false,
        isPublic: true,
        createdAt: null,
        updatedAt: null,
        threadCount: 0,
        threads: [],
        author: null,
      },
      now,
    )

    expect(view.authorName).toBe('Student')
    expect(view.authorInitials).toBe('ST')
  })
})
