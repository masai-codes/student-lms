import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ setClosed: vi.fn() }))

vi.mock('@/server/new-discussions/services/setLearnDiscussionClosed', () => ({
  setLearnDiscussionClosed: hoisted.setClosed,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function request(body: unknown) {
  return new Request('http://localhost/api/learn/discussions/12/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: 'session=abc' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function loadHandler() {
  const mod = await import('../setLearnDiscussionClosed.handler')
  return mod.handleSetLearnDiscussionClosed
}

describe('setLearnDiscussionClosed.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.setClosed.mockResolvedValue({ isClosed: true })
  })

  it('closes the discussion and echoes the state', async () => {
    const handle = await loadHandler()
    const res = await handle(request({ isClosed: true }), '12')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ isClosed: true })
    expect(hoisted.setClosed).toHaveBeenCalledWith({
      viewerUserId: 7,
      discussionId: 12,
      isClosed: true,
    })
  })

  it('returns 400 for a missing body flag', async () => {
    const handle = await loadHandler()
    const res = await handle(request({}), '12')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_DISCUSSION_PAYLOAD',
    })
    expect(hoisted.setClosed).not.toHaveBeenCalled()
  })

  it('maps a forbidden service error to 403', async () => {
    const handle = await loadHandler()
    hoisted.setClosed.mockRejectedValueOnce(new Error('DISCUSSION_FORBIDDEN'))
    const res = await handle(request({ isClosed: false }), '12')
    expect(res.headers.get('x-true-status')).toBe('403')
  })
})
