import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  assertStudentMayInteractWithDiscussion: vi.fn(),
  select: vi.fn(),
}))

vi.mock('@/server/new-discussions/services/discussionAccess', () => ({
  assertStudentMayInteractWithDiscussion: hoisted.assertStudentMayInteractWithDiscussion,
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.select,
  },
}))

import { getLearnDiscussionById } from '../getLearnDiscussionById'

describe('getLearnDiscussionById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.assertStudentMayInteractWithDiscussion.mockResolvedValue(undefined)
  })

  it('returns discussion with threads after access check', async () => {
    const discussionLimit = vi.fn().mockResolvedValue([
      {
        id: 10,
        title: 'Pointer help',
        message: '<p>Main post</p>',
        isClosed: 0,
        createdAt: '2026-05-20T10:00:00.000Z',
        authorId: 1,
        authorName: 'Priya',
        authorProfilePhotoPath: null,
      },
    ])
    const discussionWhere = vi.fn().mockReturnValue({ limit: discussionLimit })
    const discussionLeftJoin = vi.fn().mockReturnValue({ where: discussionWhere })
    const discussionFrom = vi.fn().mockReturnValue({ leftJoin: discussionLeftJoin })

    const threadOrderBy = vi.fn().mockResolvedValue([
      {
        id: 99,
        message: '<p>Reply one</p>',
        createdAt: '2026-05-20T11:00:00.000Z',
        authorId: 2,
        authorName: 'Ravi',
        authorProfilePhotoPath: '/avatars/ravi.png',
      },
    ])
    const threadWhere = vi.fn().mockReturnValue({ orderBy: threadOrderBy })
    const threadLeftJoin = vi.fn().mockReturnValue({ where: threadWhere })
    const threadFrom = vi.fn().mockReturnValue({ leftJoin: threadLeftJoin })

    hoisted.select
      .mockReturnValueOnce({ from: discussionFrom })
      .mockReturnValueOnce({ from: threadFrom })

    const result = await getLearnDiscussionById(5, 10)

    expect(hoisted.assertStudentMayInteractWithDiscussion).toHaveBeenCalledWith(5, 10)
    expect(result.id).toBe(10)
    expect(result.title).toBe('Pointer help')
    expect(result.isClosed).toBe(false)
    expect(result.threads).toHaveLength(1)
    expect(result.threads[0]?.message).toBe('<p>Reply one</p>')
    expect(result.threads[0]?.authorProfileImageUrl).toBe('/avatars/ravi.png')
  })
})
