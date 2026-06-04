import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
    insert: hoisted.dbInsert,
    update: hoisted.dbUpdate,
    delete: hoisted.dbDelete,
  },
}))
vi.mock('@/db/schema', () => ({
  votes: {
    id: 'votes.id',
    userId: 'votes.user_id',
    postId: 'votes.post_id',
    replyId: 'votes.reply_id',
    vote: 'votes.vote',
  },
}))

const existingChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})
const countChain = (rows: unknown) => ({
  from: () => ({ where: () => Promise.resolve(rows) }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('voteCommunityDiscussion', () => {
  it('inserts a vote when none exists', async () => {
    const { voteCommunityDiscussion } = await import(
      '../services/voteCommunityDiscussion.service'
    )
    hoisted.dbSelect
      .mockReturnValueOnce(existingChain([]))
      .mockReturnValueOnce(countChain([{ total: 5 }]))
    hoisted.dbInsert.mockReturnValueOnce({ values: () => Promise.resolve([]) })

    await expect(voteCommunityDiscussion(1, 7, 'upvote')).resolves.toEqual({
      upvotes: 5,
      myVote: 'upvote',
    })
    expect(hoisted.dbInsert).toHaveBeenCalled()
  })

  it('removes the vote when the same vote is repeated', async () => {
    const { voteCommunityDiscussion } = await import(
      '../services/voteCommunityDiscussion.service'
    )
    hoisted.dbSelect
      .mockReturnValueOnce(existingChain([{ id: 9, vote: 'upvote' }]))
      .mockReturnValueOnce(countChain([{ total: 4 }]))
    hoisted.dbDelete.mockReturnValueOnce({ where: () => Promise.resolve([]) })

    await expect(voteCommunityDiscussion(1, 7, 'upvote')).resolves.toEqual({
      upvotes: 4,
      myVote: null,
    })
    expect(hoisted.dbDelete).toHaveBeenCalled()
  })

  it('switches the vote when the opposite is cast', async () => {
    const { voteCommunityDiscussion } = await import(
      '../services/voteCommunityDiscussion.service'
    )
    hoisted.dbSelect
      .mockReturnValueOnce(existingChain([{ id: 9, vote: 'downvote' }]))
      .mockReturnValueOnce(countChain([{ total: 6 }]))
    hoisted.dbUpdate.mockReturnValueOnce({
      set: () => ({ where: () => Promise.resolve([]) }),
    })

    await expect(voteCommunityDiscussion(1, 7, 'upvote')).resolves.toEqual({
      upvotes: 6,
      myVote: 'upvote',
    })
    expect(hoisted.dbUpdate).toHaveBeenCalled()
  })

  it('votes on a reply via replyId', async () => {
    const { voteDiscussionReply } = await import(
      '../services/voteCommunityDiscussion.service'
    )
    const captured: Array<unknown> = []
    hoisted.dbSelect
      .mockReturnValueOnce(existingChain([]))
      .mockReturnValueOnce(countChain([{ total: 2 }]))
    hoisted.dbInsert.mockReturnValueOnce({
      values: (value: unknown) => {
        captured.push(value)
        return Promise.resolve([])
      },
    })

    await expect(voteDiscussionReply(1, 3, 'upvote')).resolves.toEqual({
      upvotes: 2,
      myVote: 'upvote',
    })
    expect(captured[0]).toMatchObject({ userId: 1, replyId: 3, vote: 'upvote' })
  })

  it('rejects an invalid post id or vote', async () => {
    const { voteCommunityDiscussion } = await import(
      '../services/voteCommunityDiscussion.service'
    )
    await expect(voteCommunityDiscussion(1, 0, 'upvote')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_POST_ID',
    })
    await expect(
      voteCommunityDiscussion(1, 7, 'sideways'),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_VOTE' })
  })
})
