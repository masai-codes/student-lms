import { describe, expect, it } from 'vitest'
import { getMocks, mockSelectChain, registerCommonBeforeEach } from './testSetup'

registerCommonBeforeEach()
const mocks = getMocks()

describe('community discussions admin flexibility', () => {
  it('createCommunityPost allows admin without joined club when clubId is provided', async () => {
    const { createCommunityPostHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(101)
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectChain([]))
      .mockReturnValueOnce(mockSelectChain([{ role: 'admin' }]))
    mocks.dbExecute.mockResolvedValueOnce(undefined)

    await expect(
      createCommunityPostHandler({
        data: { title: 'Admin post', content: '<p>hello</p>', clubId: 'club-42' },
      }),
    ).resolves.toEqual({ success: true })
  })

  it('createCommunityReply allows admin without joined club', async () => {
    const { createCommunityReplyHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(101)
    mocks.dbExecute
      .mockResolvedValueOnce([{ id: '1', clubId: 'club-42', authorId: 101 }])
      .mockResolvedValueOnce(undefined)
    mocks.dbSelect.mockReturnValueOnce(mockSelectChain([{ role: 'admin' }]))

    await expect(
      createCommunityReplyHandler({
        data: { postId: 1, content: 'Admin reply' },
      }),
    ).resolves.toEqual({ success: true })
  })

  it('voteCommunityPost allows admin without joined club', async () => {
    const { voteCommunityPostHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(101)
    mocks.dbExecute
      .mockResolvedValueOnce([{ id: '1', clubId: 'club-42', authorId: 101 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
    mocks.dbSelect.mockReturnValueOnce(mockSelectChain([{ role: 'admin' }]))

    await expect(
      voteCommunityPostHandler({
        data: { postId: 1, vote: 'upvote' },
      }),
    ).resolves.toEqual({ success: true })
  })

  it('voteCommunityReply allows admin without joined club', async () => {
    const { voteCommunityReplyHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(101)
    mocks.dbExecute
      .mockResolvedValueOnce([{ id: 'r-1', postId: '1', clubId: 'club-42' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
    mocks.dbSelect.mockReturnValueOnce(mockSelectChain([{ role: 'admin' }]))

    await expect(
      voteCommunityReplyHandler({
        data: { replyId: 'r-1', vote: 'upvote' },
      }),
    ).resolves.toEqual({ success: true })
  })

  it('toggleCommunityPostBookmark allows admin without joined club', async () => {
    const { toggleCommunityPostBookmarkHandler } = await import('../communityDiscussions')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(101)
    mocks.dbExecute
      .mockResolvedValueOnce([{ id: '1', clubId: 'club-42' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
    mocks.dbSelect.mockReturnValueOnce(mockSelectChain([{ role: 'admin' }]))

    await expect(
      toggleCommunityPostBookmarkHandler({
        data: { postId: 1 },
      }),
    ).resolves.toEqual({ success: true, isBookmarked: true })
  })
})
