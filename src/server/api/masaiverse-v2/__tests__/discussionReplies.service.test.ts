import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn(), dbInsert: vi.fn() }))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))
vi.mock('@/db/schema', () => ({
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
  it('maps replies with author and UTC ISO timestamps', async () => {
    const { getDiscussionReplies } = await import(
      '../services/getDiscussionReplies.service'
    )
    hoisted.dbSelect
      .mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              orderBy: () =>
                Promise.resolve([
                  {
                    id: 3,
                    content: 'Great question!',
                    createdAt: '2026-06-03 09:30:00',
                    authorName: 'Sneha Rao',
                  },
                ]),
            }),
          }),
        }),
      })
      .mockReturnValueOnce(groupedChain([{ replyId: 3, total: 2 }]))
      .mockReturnValueOnce(whereChain([{ replyId: 3, vote: 'upvote' }]))

    await expect(getDiscussionReplies(7, 12)).resolves.toEqual([
      {
        id: '3',
        authorName: 'Sneha Rao',
        content: 'Great question!',
        upvotes: 2,
        myVote: 'upvote',
        createdAt: '2026-06-03T09:30:00.000Z',
      },
    ])
  })
})

describe('createDiscussionReply', () => {
  it('inserts a reply and returns its id', async () => {
    const { createDiscussionReply } = await import(
      '../services/createDiscussionReply.service'
    )
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
  })

  it('rejects empty content and invalid post id', async () => {
    const { createDiscussionReply } = await import(
      '../services/createDiscussionReply.service'
    )
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
