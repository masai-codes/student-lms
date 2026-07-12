import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLearnDiscussionClosed } from '../setLearnDiscussionClosed'

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

describe('setLearnDiscussionClosed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.where.mockResolvedValue(undefined)
    hoisted.set.mockReturnValue({ where: hoisted.where })
    hoisted.update.mockReturnValue({ set: hoisted.set })
  })

  it('closes an open discussion', async () => {
    hoisted.assertOwns.mockResolvedValue({ id: 5, userId: 1, isClosed: 0, data: null })
    const result = await setLearnDiscussionClosed({
      viewerUserId: 1,
      discussionId: 5,
      isClosed: true,
    })
    expect(result).toEqual({ isClosed: true })
    expect(hoisted.update).toHaveBeenCalledTimes(1)
  })

  it('reopens a closed discussion', async () => {
    hoisted.assertOwns.mockResolvedValue({ id: 5, userId: 1, isClosed: 1, data: null })
    const result = await setLearnDiscussionClosed({
      viewerUserId: 1,
      discussionId: 5,
      isClosed: false,
    })
    expect(result).toEqual({ isClosed: false })
    expect(hoisted.update).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when already in the requested state', async () => {
    hoisted.assertOwns.mockResolvedValue({ id: 5, userId: 1, isClosed: 1, data: null })
    const result = await setLearnDiscussionClosed({
      viewerUserId: 1,
      discussionId: 5,
      isClosed: true,
    })
    expect(result).toEqual({ isClosed: true })
    expect(hoisted.update).not.toHaveBeenCalled()
  })

  it('propagates ownership errors', async () => {
    hoisted.assertOwns.mockRejectedValueOnce(new Error('DISCUSSION_FORBIDDEN'))
    await expect(
      setLearnDiscussionClosed({ viewerUserId: 2, discussionId: 5, isClosed: true }),
    ).rejects.toThrow('DISCUSSION_FORBIDDEN')
  })
})
