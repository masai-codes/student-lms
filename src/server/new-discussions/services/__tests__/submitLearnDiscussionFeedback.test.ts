import { beforeEach, describe, expect, it, vi } from 'vitest'

import { submitLearnDiscussionFeedback } from '../submitLearnDiscussionFeedback'

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

describe('submitLearnDiscussionFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.where.mockResolvedValue(undefined)
    hoisted.set.mockReturnValue({ where: hoisted.where })
    hoisted.update.mockReturnValue({ set: hoisted.set })
    hoisted.assertOwns.mockResolvedValue({
      id: 5,
      userId: 1,
      isClosed: 1,
      data: null,
    })
  })

  it('merges feedback into existing data', async () => {
    hoisted.assertOwns.mockResolvedValue({
      id: 5,
      userId: 1,
      isClosed: 1,
      data: { existing: true },
    })
    const result = await submitLearnDiscussionFeedback({
      viewerUserId: 1,
      discussionId: 5,
      rating: 4,
      comment: 'Helpful',
    })
    expect(result).toEqual({ rating: 4 })
    expect(hoisted.set).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          existing: true,
          learnFeedback: { rating: 4, comment: 'Helpful' },
        },
      }),
    )
  })

  it('stores a null comment when omitted', async () => {
    await submitLearnDiscussionFeedback({
      viewerUserId: 1,
      discussionId: 5,
      rating: 5,
    })
    expect(hoisted.set).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { learnFeedback: { rating: 5, comment: null } },
      }),
    )
  })

  it('rejects an invalid rating before touching the db', async () => {
    await expect(
      submitLearnDiscussionFeedback({
        viewerUserId: 1,
        discussionId: 5,
        rating: 9,
      }),
    ).rejects.toThrow('INVALID_FEEDBACK_PAYLOAD')
    expect(hoisted.assertOwns).not.toHaveBeenCalled()
    expect(hoisted.update).not.toHaveBeenCalled()
  })
})
