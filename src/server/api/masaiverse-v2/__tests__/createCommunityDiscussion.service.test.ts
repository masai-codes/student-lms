import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbInsert: vi.fn(),
  awardPostCreationPoints: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { insert: hoisted.dbInsert } }))
vi.mock('@/db/schema', () => ({ posts: 'posts' }))
vi.mock('../services/awardLeaderboardPoints.service', () => ({
  awardPostCreationPoints: hoisted.awardPostCreationPoints,
}))

/** Captures the inserted values and returns a fake mysql2 result header. */
function mockInsert(captured: Array<unknown>, insertId = 99) {
  hoisted.dbInsert.mockReturnValueOnce({
    values: (value: unknown) => {
      captured.push(value)
      return Promise.resolve([{ insertId }])
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createCommunityDiscussion', () => {
  it('inserts a club-less post for the user and returns its id', async () => {
    const { createCommunityDiscussion } = await import(
      '../services/createCommunityDiscussion.service'
    )
    const captured: Array<Record<string, unknown>> = []
    mockInsert(captured)

    await expect(
      createCommunityDiscussion(5, {
        title: '  Hello  ',
        content: '<p>Hi</p>',
        tags: ['Career', 'Interviews'],
      }),
    ).resolves.toEqual({ id: '99' })

    expect(captured[0]).toMatchObject({
      clubId: null,
      userId: 5,
      title: 'Hello',
      // Tags are appended to the stored content behind the marker.
      content: '<p>Hi</p><!--tags:Career,Interviews-->',
    })
    // Awards post-creation points to the author with no club (club-less post).
    expect(hoisted.awardPostCreationPoints).toHaveBeenCalledWith({
      authorId: 5,
      postId: 99,
      clubId: null,
    })
  })

  it('inserts a club-scoped post when a clubId is given', async () => {
    const { createCommunityDiscussion } = await import(
      '../services/createCommunityDiscussion.service'
    )
    const captured: Array<Record<string, unknown>> = []
    mockInsert(captured)

    await expect(
      createCommunityDiscussion(5, {
        title: 'In club',
        content: '<p>Hi</p>',
        tags: [],
        clubId: '81910',
      }),
    ).resolves.toEqual({ id: '99' })

    // The club id is coerced to a number for the post and the points award.
    expect(captured[0]).toMatchObject({ clubId: 81910, userId: 5 })
    expect(hoisted.awardPostCreationPoints).toHaveBeenCalledWith({
      authorId: 5,
      postId: 99,
      clubId: 81910,
    })
  })

  it('rejects an empty title without inserting', async () => {
    const { createCommunityDiscussion } = await import(
      '../services/createCommunityDiscussion.service'
    )
    await expect(
      createCommunityDiscussion(5, {
        title: '   ',
        content: '<p>Hi</p>',
        tags: [],
      }),
    ).rejects.toMatchObject({ status: 400, code: 'DISCUSSION_TITLE_REQUIRED' })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('rejects empty content without inserting', async () => {
    const { createCommunityDiscussion } = await import(
      '../services/createCommunityDiscussion.service'
    )
    await expect(
      createCommunityDiscussion(5, { title: 'Hi', content: '   ', tags: [] }),
    ).rejects.toMatchObject({ status: 400, code: 'DISCUSSION_CONTENT_REQUIRED' })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })
})
