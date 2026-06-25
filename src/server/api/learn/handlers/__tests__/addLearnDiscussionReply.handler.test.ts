import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  reply: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/new-discussions/services/addReplyToLearnDiscussion', () => ({
  addReplyToLearnDiscussion: hoisted.reply,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function request(body: unknown, cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/discussions/12/replies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function loadHandler() {
  const mod = await import('../addLearnDiscussionReply.handler')
  return mod.handleAddLearnDiscussionReply
}

describe('addLearnDiscussionReply.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserIdFromCookieHeader.mockResolvedValue(7)
    hoisted.reply.mockResolvedValue(undefined)
  })

  it('adds a reply and returns ok', async () => {
    const handle = await loadHandler()
    const res = await handle(request({ message: 'Thanks!' }), '12')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(hoisted.reply).toHaveBeenCalledWith({
      authorUserId: 7,
      discussionId: 12,
      rawMessage: 'Thanks!',
    })
  })

  it('returns 401 when unauthenticated', async () => {
    const handle = await loadHandler()
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handle(request({ message: 'Thanks!' }, null), '12')

    expect(res.status).toBe(401)
    expect(hoisted.reply).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid discussion id', async () => {
    const handle = await loadHandler()

    const res = await handle(request({ message: 'Thanks!' }), '0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_DISCUSSION_ID',
    })
    expect(hoisted.reply).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid body', async () => {
    const handle = await loadHandler()

    const res = await handle(request({ message: 123 }), '12')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_REPLY_MESSAGE',
    })
    expect(hoisted.reply).not.toHaveBeenCalled()
  })

  it('maps a not-found service error to 404', async () => {
    const handle = await loadHandler()
    hoisted.reply.mockRejectedValueOnce(new Error('DISCUSSION_NOT_FOUND'))

    const res = await handle(request({ message: 'Thanks!' }), '12')

    expect(res.status).toBe(404)
  })

  it('maps a closed-discussion service error to 409', async () => {
    const handle = await loadHandler()
    hoisted.reply.mockRejectedValueOnce(new Error('DISCUSSION_CLOSED'))

    const res = await handle(request({ message: 'Thanks!' }), '12')

    expect(res.status).toBe(409)
  })
})
