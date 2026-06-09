import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbDelete: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
    insert: hoisted.dbInsert,
    delete: hoisted.dbDelete,
  },
}))
vi.mock('@/db/schema', () => ({
  masaiverseLeaderboard: {
    userId: 'ml.user_id',
    createdBy: 'ml.created_by',
    reason: 'ml.reason',
    points: 'ml.points',
    clubId: 'ml.club_id',
    postId: 'ml.post_id',
    replyId: 'ml.reply_id',
  },
  posts: { id: 'posts.id', userId: 'posts.user_id', clubId: 'posts.club_id' },
  replies: {
    id: 'replies.id',
    userId: 'replies.user_id',
    postId: 'replies.post_id',
  },
}))

const limitChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})

function captureInserts(captured: Array<unknown>) {
  hoisted.dbInsert.mockReturnValue({
    values: (value: unknown) => {
      captured.push(value)
      return Promise.resolve([])
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('awardPostCreationPoints', () => {
  it('inserts a single 10-point post_creation row', async () => {
    const { awardPostCreationPoints } =
      await import('../services/awardLeaderboardPoints.service')
    const captured: Array<Array<Record<string, unknown>>> = []
    captureInserts(captured)

    await awardPostCreationPoints({ authorId: 5, postId: 99, clubId: 3 })

    expect(captured[0]).toEqual([
      {
        userId: 5,
        createdBy: 5,
        reason: 'post_creation',
        points: 10,
        clubId: 3,
        postId: 99,
        replyId: null,
      },
    ])
  })
})

describe('awardReplyPoints', () => {
  it('awards given + received when the replier is not the author', async () => {
    const { awardReplyPoints } =
      await import('../services/awardLeaderboardPoints.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([{ authorId: 2, clubId: 7 }]),
    )
    const captured: Array<Array<Record<string, unknown>>> = []
    captureInserts(captured)

    await awardReplyPoints({ replierId: 1, postId: 7, replyId: 55 })

    expect(captured[0]).toEqual([
      {
        userId: 1,
        createdBy: 1,
        reason: 'reply_given',
        points: 5,
        clubId: 7,
        postId: 7,
        replyId: 55,
      },
      {
        userId: 2,
        createdBy: 1,
        reason: 'reply_received',
        points: 5,
        clubId: 7,
        postId: 7,
        replyId: 55,
      },
    ])
  })

  it('skips reply_received on a self-reply', async () => {
    const { awardReplyPoints } =
      await import('../services/awardLeaderboardPoints.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([{ authorId: 1, clubId: null }]),
    )
    const captured: Array<Array<Record<string, unknown>>> = []
    captureInserts(captured)

    await awardReplyPoints({ replierId: 1, postId: 7, replyId: 55 })

    expect(captured[0]).toHaveLength(1)
    expect(captured[0][0]).toMatchObject({
      reason: 'reply_given',
      clubId: null,
    })
  })

  it('does nothing when the post is gone', async () => {
    const { awardReplyPoints } =
      await import('../services/awardLeaderboardPoints.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))

    await awardReplyPoints({ replierId: 1, postId: 7, replyId: 55 })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })
})

describe('awardUpvotePoints', () => {
  it('awards post given + received for an upvote on another user post', async () => {
    const { awardUpvotePoints } =
      await import('../services/awardLeaderboardPoints.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([{ authorId: 2, clubId: 4 }]),
    )
    const captured: Array<Array<Record<string, unknown>>> = []
    captureInserts(captured)

    await awardUpvotePoints({ voterId: 1, target: { postId: 7 } })

    expect(captured[0]).toEqual([
      {
        userId: 1,
        createdBy: 1,
        reason: 'upvote_given_on_post',
        points: 1,
        clubId: 4,
        postId: 7,
        replyId: null,
      },
      {
        userId: 2,
        createdBy: 1,
        reason: 'upvote_receive_on_post',
        points: 1,
        clubId: 4,
        postId: 7,
        replyId: null,
      },
    ])
  })

  it('awards reply given + received using the post club, only given on self', async () => {
    const { awardUpvotePoints } =
      await import('../services/awardLeaderboardPoints.service')
    // Reply owned by the voter → only the "given" award; club from the post.
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ ownerId: 1, postId: 7 }]))
      .mockReturnValueOnce(limitChain([{ authorId: 9, clubId: 6 }]))
    const captured: Array<Array<Record<string, unknown>>> = []
    captureInserts(captured)

    await awardUpvotePoints({ voterId: 1, target: { replyId: 3 } })

    expect(captured[0]).toEqual([
      {
        userId: 1,
        createdBy: 1,
        reason: 'upvote_given_on_reply',
        points: 1,
        clubId: 6,
        postId: null,
        replyId: 3,
      },
    ])
  })

  it('does nothing when the upvoted target is gone', async () => {
    const { awardUpvotePoints } =
      await import('../services/awardLeaderboardPoints.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))

    await awardUpvotePoints({ voterId: 1, target: { postId: 7 } })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })
})

describe('revokeUpvotePoints', () => {
  it('deletes the voter rows for the target', async () => {
    const { revokeUpvotePoints } =
      await import('../services/awardLeaderboardPoints.service')
    const where = vi.fn(() => Promise.resolve([]))
    hoisted.dbDelete.mockReturnValue({ where })

    await revokeUpvotePoints({ voterId: 1, target: { replyId: 3 } })
    expect(hoisted.dbDelete).toHaveBeenCalled()
    expect(where).toHaveBeenCalled()
  })
})

describe('awardEventRegistrationPoints', () => {
  it('inserts a single 5-point event_registration row with club + event ids', async () => {
    const { awardEventRegistrationPoints } =
      await import('../services/awardLeaderboardPoints.service')
    const captured: Array<Record<string, unknown>> = []
    hoisted.dbInsert.mockReturnValue({
      values: (value: Record<string, unknown>) => {
        captured.push(value)
        return Promise.resolve([])
      },
    })

    await awardEventRegistrationPoints({ userId: 5, eventId: 42, clubId: 3 })

    expect(captured[0]).toEqual({
      userId: 5,
      createdBy: 5,
      reason: 'event_registration',
      points: 5,
      clubId: 3,
      eventId: 42,
    })
  })

  it('stores a null club id for a community-wide event', async () => {
    const { awardEventRegistrationPoints } =
      await import('../services/awardLeaderboardPoints.service')
    const captured: Array<Record<string, unknown>> = []
    hoisted.dbInsert.mockReturnValue({
      values: (value: Record<string, unknown>) => {
        captured.push(value)
        return Promise.resolve([])
      },
    })

    await awardEventRegistrationPoints({ userId: 5, eventId: 42, clubId: null })
    expect(captured[0]).toMatchObject({ clubId: null, eventId: 42 })
  })
})
