import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  vote: vi.fn(),
  voteReply: vi.fn(),
  listReplies: vi.fn(),
  createReply: vi.fn(),
  listDiscussions: vi.fn(),
  canSeeUnpublished: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/voteCommunityDiscussion.service',
  () => ({
    voteCommunityDiscussion: hoisted.vote,
    voteDiscussionReply: hoisted.voteReply,
  }),
)
vi.mock(
  '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service',
  () => ({
    getCommunityDiscussions: hoisted.listDiscussions,
  }),
)
vi.mock(
  '@/server/api/masaiverse-v2/services/getDiscussionReplies.service',
  () => ({
    getDiscussionReplies: hoisted.listReplies,
  }),
)
vi.mock(
  '@/server/api/masaiverse-v2/services/createDiscussionReply.service',
  () => ({
    createDiscussionReply: hoisted.createReply,
  }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))
vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: hoisted.canSeeUnpublished,
}))

const cookie = { cookie: 'session=abc' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
  vi.mocked(requireSessionUserId).mockResolvedValue(5)
  hoisted.canSeeUnpublished.mockResolvedValue(false)
})

describe('handleVoteCommunityDiscussion', () => {
  it('returns the new vote state', async () => {
    const { handleVoteCommunityDiscussion } =
      await import('../handlers/voteCommunityDiscussion.handler')
    hoisted.vote.mockResolvedValueOnce({ upvotes: 25, myVote: 'upvote' })

    const res = await handleVoteCommunityDiscussion(
      new Request('http://localhost/api/masaiverse-v2/discussions/vote', {
        method: 'POST',
        headers: cookie,
        body: JSON.stringify({ postId: '7', vote: 'upvote' }),
      }),
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ upvotes: 25, myVote: 'upvote' })
    expect(hoisted.vote).toHaveBeenCalledWith(5, 7, 'upvote')
  })

  it('votes on a reply when replyId is present', async () => {
    const { handleVoteCommunityDiscussion } =
      await import('../handlers/voteCommunityDiscussion.handler')
    hoisted.voteReply.mockResolvedValueOnce({ upvotes: 3, myVote: 'upvote' })

    const res = await handleVoteCommunityDiscussion(
      new Request('http://localhost/api/masaiverse-v2/discussions/vote', {
        method: 'POST',
        headers: cookie,
        body: JSON.stringify({ replyId: '3', vote: 'upvote' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(hoisted.voteReply).toHaveBeenCalledWith(5, 3, 'upvote')
    expect(hoisted.vote).not.toHaveBeenCalled()
  })

  it('maps an ApiError to its status', async () => {
    const { handleVoteCommunityDiscussion } =
      await import('../handlers/voteCommunityDiscussion.handler')
    hoisted.vote.mockRejectedValueOnce(new ApiError(400, 'INVALID_VOTE'))

    const res = await handleVoteCommunityDiscussion(
      new Request('http://localhost/api/masaiverse-v2/discussions/vote', {
        method: 'POST',
        headers: cookie,
        body: JSON.stringify({ postId: '7', vote: 'x' }),
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('handleListCommunityDiscussions', () => {
  it('parses offset/limit and returns the page', async () => {
    const { handleListCommunityDiscussions } =
      await import('../handlers/listCommunityDiscussions.handler')
    hoisted.listDiscussions.mockResolvedValueOnce({
      discussions: [{ id: '7' }],
      hasMore: true,
    })

    const res = await handleListCommunityDiscussions(
      new Request(
        'http://localhost/api/masaiverse-v2/discussions?offset=5&limit=5&q=react',
        { headers: cookie },
      ),
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      discussions: [{ id: '7' }],
      hasMore: true,
    })
    // No clubId in the query string → community feed (clubId null).
    expect(hoisted.listDiscussions).toHaveBeenCalledWith(
      5,
      5,
      5,
      'react',
      null,
      false,
    )
  })

  it('forwards a clubId from the query string to scope the feed', async () => {
    const { handleListCommunityDiscussions } =
      await import('../handlers/listCommunityDiscussions.handler')
    hoisted.listDiscussions.mockResolvedValueOnce({
      discussions: [],
      hasMore: false,
    })

    const res = await handleListCommunityDiscussions(
      new Request(
        'http://localhost/api/masaiverse-v2/discussions?clubId=81910',
        { headers: cookie },
      ),
    )
    expect(res.status).toBe(200)
    expect(hoisted.listDiscussions).toHaveBeenCalledWith(
      5,
      0,
      5,
      '',
      '81910',
      false,
    )
  })
})

describe('discussion replies handlers', () => {
  it('lists replies for a post id from the query string', async () => {
    const { handleListDiscussionReplies } =
      await import('../handlers/discussionReplies.handler')
    hoisted.listReplies.mockResolvedValueOnce([{ id: '3' }])

    const res = await handleListDiscussionReplies(
      new Request(
        'http://localhost/api/masaiverse-v2/discussions/replies?postId=7',
        { headers: cookie },
      ),
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ replies: [{ id: '3' }] })
    expect(hoisted.listReplies).toHaveBeenCalledWith(7, 5, false)
  })

  it('creates a reply and returns 201', async () => {
    const { handleCreateDiscussionReply } =
      await import('../handlers/discussionReplies.handler')
    hoisted.createReply.mockResolvedValueOnce({ id: '55' })

    const res = await handleCreateDiscussionReply(
      new Request('http://localhost/api/masaiverse-v2/discussions/replies', {
        method: 'POST',
        headers: cookie,
        body: JSON.stringify({ postId: '7', content: 'Nice' }),
      }),
    )
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual({ id: '55' })
    expect(hoisted.createReply).toHaveBeenCalledWith(5, 7, 'Nice')
  })

  it('returns 401 when not signed in', async () => {
    const { handleCreateDiscussionReply } =
      await import('../handlers/discussionReplies.handler')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleCreateDiscussionReply(
      new Request('http://localhost/api/masaiverse-v2/discussions/replies', {
        method: 'POST',
        body: JSON.stringify({ postId: '7', content: 'Nice' }),
      }),
    )
    expect(res.status).toBe(401)
  })
})
