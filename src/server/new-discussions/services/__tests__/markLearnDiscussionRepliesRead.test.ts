import { beforeEach, describe, expect, it, vi } from 'vitest'

import { markLearnDiscussionRepliesRead } from '../markLearnDiscussionRepliesRead'

const hoisted = vi.hoisted(() => ({
  assertOwns: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../assertViewerOwnsDiscussion', () => ({
  assertViewerOwnsDiscussion: hoisted.assertOwns,
}))
vi.mock('@/db', () => ({ db: { update: hoisted.update } }))

describe('markLearnDiscussionRepliesRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.where.mockResolvedValue(undefined)
    hoisted.set.mockReturnValue({ where: hoisted.where })
    hoisted.update.mockReturnValue({ set: hoisted.set })
    hoisted.assertOwns.mockResolvedValue({
      id: 10,
      userId: 1,
      isClosed: 0,
      data: null,
    })
  })

  it('checks ownership then updates unread replies', async () => {
    await markLearnDiscussionRepliesRead({ viewerUserId: 1, discussionId: 10 })
    expect(hoisted.assertOwns).toHaveBeenCalledWith(1, 10)
    expect(hoisted.update).toHaveBeenCalledTimes(1)
    expect(hoisted.set).toHaveBeenCalledTimes(1)
    expect(hoisted.where).toHaveBeenCalledTimes(1)
  })

  it('propagates access errors without updating', async () => {
    hoisted.assertOwns.mockRejectedValueOnce(new Error('DISCUSSION_FORBIDDEN'))
    await expect(
      markLearnDiscussionRepliesRead({ viewerUserId: 2, discussionId: 10 }),
    ).rejects.toThrow('DISCUSSION_FORBIDDEN')
    expect(hoisted.update).not.toHaveBeenCalled()
  })
})
