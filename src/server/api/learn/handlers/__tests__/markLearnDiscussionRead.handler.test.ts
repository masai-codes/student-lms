import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ markRead: vi.fn() }))

vi.mock(
  '@/server/new-discussions/services/markLearnDiscussionRepliesRead',
  () => ({
    markLearnDiscussionRepliesRead: hoisted.markRead,
  }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

async function loadHandler() {
  const mod = await import('../markLearnDiscussionRead.handler')
  return mod.handleMarkLearnDiscussionRead
}

describe('markLearnDiscussionRead.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.markRead.mockResolvedValue(undefined)
  })

  it('marks replies read and returns ok', async () => {
    const handle = await loadHandler()
    const res = await handle('12')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(hoisted.markRead).toHaveBeenCalledWith({
      viewerUserId: 7,
      discussionId: 12,
    })
  })

  it('returns 400 for an invalid discussion id', async () => {
    const handle = await loadHandler()
    const res = await handle('0')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_DISCUSSION_ID',
    })
    expect(hoisted.markRead).not.toHaveBeenCalled()
  })

  it('maps a forbidden service error to 403', async () => {
    const handle = await loadHandler()
    hoisted.markRead.mockRejectedValueOnce(new Error('DISCUSSION_FORBIDDEN'))
    const res = await handle('12')
    expect(res.headers.get('x-true-status')).toBe('403')
  })
})
