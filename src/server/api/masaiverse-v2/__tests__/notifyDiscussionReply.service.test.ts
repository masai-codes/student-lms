import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  posts: { id: 'posts.id', userId: 'posts.user_id', clubId: 'posts.club_id' },
}))
vi.mock('@/server/masaiverse/triggerExperienceApiCommunityNotify', () => ({
  notifyDiscussionReplyViaExperienceApi: hoisted.notify,
}))

const postChain = (row: unknown) => ({
  from: () => ({
    where: () => ({ limit: () => Promise.resolve(row ? [row] : []) }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notifyDiscussionReply', () => {
  it('notifies the club post author with clubId and the reply type', async () => {
    const { notifyDiscussionReply, DISCUSSION_REPLY_NOTIFICATION_TYPE } =
      await import('../services/notifyDiscussionReply.service')
    hoisted.dbSelect.mockReturnValueOnce(postChain({ authorId: 9, clubId: 4 }))

    await notifyDiscussionReply({
      postId: 7,
      replierId: 1,
      replyPreview: 'Nice',
    })

    expect(hoisted.notify).toHaveBeenCalledWith({
      postId: 7,
      recipientUserId: 9,
      actorUserId: 1,
      replyPreview: 'Nice',
      clubId: 4,
      notificationType: DISCUSSION_REPLY_NOTIFICATION_TYPE,
    })
  })

  it('sends clubId null for a public (community) post', async () => {
    const { notifyDiscussionReply } =
      await import('../services/notifyDiscussionReply.service')
    hoisted.dbSelect.mockReturnValueOnce(
      postChain({ authorId: 9, clubId: null }),
    )

    await notifyDiscussionReply({ postId: 7, replierId: 1, replyPreview: 'Hi' })

    expect(hoisted.notify).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 9, clubId: null }),
    )
  })

  it('skips self-replies', async () => {
    const { notifyDiscussionReply } =
      await import('../services/notifyDiscussionReply.service')
    hoisted.dbSelect.mockReturnValueOnce(
      postChain({ authorId: 1, clubId: null }),
    )

    await notifyDiscussionReply({ postId: 7, replierId: 1, replyPreview: 'Hi' })

    expect(hoisted.notify).not.toHaveBeenCalled()
  })

  it('skips when the post no longer exists', async () => {
    const { notifyDiscussionReply } =
      await import('../services/notifyDiscussionReply.service')
    hoisted.dbSelect.mockReturnValueOnce(postChain(null))

    await notifyDiscussionReply({ postId: 7, replierId: 1, replyPreview: 'Hi' })

    expect(hoisted.notify).not.toHaveBeenCalled()
  })
})
