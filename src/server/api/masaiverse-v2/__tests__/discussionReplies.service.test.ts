import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  awardReplyPoints: vi.fn(),
  notifyDiscussionReply: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))
vi.mock('../services/awardLeaderboardPoints.service', () => ({
  awardReplyPoints: hoisted.awardReplyPoints,
}))
vi.mock('../services/notifyDiscussionReply.service', () => ({
  notifyDiscussionReply: hoisted.notifyDiscussionReply,
}))
vi.mock('@/db/schema', () => ({
  posts: { id: 'posts.id', meta: 'posts.meta' },
  replies: {
    id: 'replies.id',
    content: 'replies.content',
    createdAt: 'replies.created_at',
    postId: 'replies.post_id',
    userId: 'replies.user_id',
  },
  users: { id: 'users.id', name: 'users.name' },
  votes: {
    replyId: 'votes.reply_id',
    userId: 'votes.user_id',
    vote: 'votes.vote',
  },
}))

const limitChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})

const groupedChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ groupBy: () => Promise.resolve(rows) }) }),
})
const whereChain = (rows: unknown) => ({
  from: () => ({ where: () => Promise.resolve(rows) }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDiscussionReplies', () => {
  const repliesChain = (rows: unknown) => ({
    from: () => ({
      innerJoin: () => ({
        where: () => ({ orderBy: () => Promise.resolve(rows) }),
      }),
    }),
  })

  it('maps replies with author and UTC ISO timestamps', async () => {
    const { getDiscussionReplies } =
      await import('../services/getDiscussionReplies.service')
    hoisted.dbSelect
      // 1) parent post meta (no banned replies)
      .mockReturnValueOnce(limitChain([{ meta: null }]))
      // 2) replies
      .mockReturnValueOnce(
        repliesChain([
          {
            id: 3,
            content: 'Great question!',
            createdAt: '2026-06-03 09:30:00',
            authorName: 'Sneha Rao',
          },
        ]),
      )
      .mockReturnValueOnce(groupedChain([{ replyId: 3, total: 2 }]))
      .mockReturnValueOnce(whereChain([{ replyId: 3, vote: 'upvote' }]))

    await expect(getDiscussionReplies(7, 12)).resolves.toEqual([
      {
        id: '3',
        authorName: 'Sneha Rao',
        content: 'Great question!',
        upvotes: 2,
        myVote: 'upvote',
        isBanned: false,
        createdAt: '2026-06-03T09:30:00.000Z',
      },
    ])
  })

  it('hides banned replies from non-admins but keeps them flagged for admins', async () => {
    const { getDiscussionReplies } =
      await import('../services/getDiscussionReplies.service')
    const replyRows = [
      {
        id: 3,
        content: 'Visible',
        createdAt: '2026-06-03 09:30:00',
        authorName: 'Sneha Rao',
      },
      {
        id: 4,
        content: 'Banned one',
        createdAt: '2026-06-03 09:31:00',
        authorName: 'Mod Target',
      },
    ]

    // Non-admin: reply 4 (in meta.bannedReplyIds) is filtered out entirely.
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ meta: { bannedReplyIds: [4] } }]))
      .mockReturnValueOnce(repliesChain(replyRows))
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(whereChain([]))

    const forStudent = await getDiscussionReplies(7, 12)
    expect(forStudent.map((r) => r.id)).toEqual(['3'])

    // Admin (canSeeBanned): reply 4 stays, flagged isBanned.
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ meta: { bannedReplyIds: [4] } }]))
      .mockReturnValueOnce(repliesChain(replyRows))
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(whereChain([]))

    const forAdmin = await getDiscussionReplies(7, 12, true)
    expect(forAdmin.map((r) => [r.id, r.isBanned])).toEqual([
      ['3', false],
      ['4', true],
    ])
  })
})

describe('createDiscussionReply', () => {
  it('inserts a reply and returns its id', async () => {
    const { createDiscussionReply } =
      await import('../services/createDiscussionReply.service')
    const captured: Array<unknown> = []
    hoisted.dbInsert.mockReturnValueOnce({
      values: (value: unknown) => {
        captured.push(value)
        return Promise.resolve([{ insertId: 55 }])
      },
    })

    await expect(createDiscussionReply(1, 7, '  Nice  ')).resolves.toEqual({
      id: '55',
    })
    expect(captured[0]).toMatchObject({ postId: 7, userId: 1, content: 'Nice' })
    // Awards reply points (given + received) for the new reply.
    expect(hoisted.awardReplyPoints).toHaveBeenCalledWith({
      replierId: 1,
      postId: 7,
      replyId: 55,
    })
    // Notifies the post author with the trimmed reply preview.
    expect(hoisted.notifyDiscussionReply).toHaveBeenCalledWith({
      postId: 7,
      replierId: 1,
      replyPreview: 'Nice',
    })
  })

  it('rejects empty content and invalid post id', async () => {
    const { createDiscussionReply } =
      await import('../services/createDiscussionReply.service')
    await expect(createDiscussionReply(1, 7, '   ')).rejects.toMatchObject({
      status: 400,
      code: 'REPLY_CONTENT_REQUIRED',
    })
    await expect(createDiscussionReply(1, 0, 'hi')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_POST_ID',
    })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })
})
