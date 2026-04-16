import { describe, expect, it } from 'vitest'
import { getMocks, registerCommonBeforeEach } from './testSetup'

registerCommonBeforeEach()
const mocks = getMocks()

describe('community discussions auth guards', () => {
  it('fetchCommunityDiscussions rejects unauthorized user', async () => {
    const { fetchCommunityDiscussionsHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(fetchCommunityDiscussionsHandler({ data: {} })).rejects.toThrow('UNAUTHORIZED')
  })

  it('createCommunityPost rejects unauthorized user', async () => {
    const { createCommunityPostHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(
      createCommunityPostHandler({ data: { title: 'Hi', content: 'Hello' } }),
    ).rejects.toThrow('UNAUTHORIZED')
  })

  it('createCommunityReply rejects unauthorized user', async () => {
    const { createCommunityReplyHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(
      createCommunityReplyHandler({ data: { postId: 1, content: 'Hello' } }),
    ).rejects.toThrow('UNAUTHORIZED')
  })

  it('voteCommunityPost rejects unauthorized user', async () => {
    const { voteCommunityPostHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(voteCommunityPostHandler({ data: { postId: 1, vote: 'upvote' } })).rejects.toThrow(
      'UNAUTHORIZED',
    )
  })

  it('voteCommunityReply rejects unauthorized user', async () => {
    const { voteCommunityReplyHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(
      voteCommunityReplyHandler({ data: { replyId: 'r-1', vote: 'upvote' } }),
    ).rejects.toThrow('UNAUTHORIZED')
  })

  it('toggleCommunityPostBookmark rejects unauthorized user', async () => {
    const { toggleCommunityPostBookmarkHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(toggleCommunityPostBookmarkHandler({ data: { postId: 1 } })).rejects.toThrow(
      'UNAUTHORIZED',
    )
  })

  it('toggleCommunityPostBan rejects unauthorized user', async () => {
    const { toggleCommunityPostBanHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(
      toggleCommunityPostBanHandler({ data: { postId: 1, shouldBan: true } }),
    ).rejects.toThrow('UNAUTHORIZED')
  })
})
