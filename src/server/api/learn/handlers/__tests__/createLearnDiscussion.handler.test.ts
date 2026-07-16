import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  create: vi.fn(),
}))

vi.mock(
  '@/server/new-discussions/services/createDiscussionForLearnEntity',
  () => ({
    createDiscussionForLearnEntity: hoisted.create,
  }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

const validBody = {
  kind: 'lecture',
  entityId: 572,
  title: 'Need help',
  message: 'How does this work?',
}

function request(body: unknown, cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/discussions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function loadHandler() {
  const mod = await import('../createLearnDiscussion.handler')
  return mod.handleCreateLearnDiscussion
}

describe('createLearnDiscussion.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockReset()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.create.mockResolvedValue({ discussionId: 99 })
  })

  it('creates a discussion and returns the id', async () => {
    const handle = await loadHandler()
    const res = await handle(request(validBody))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ discussionId: 99 })
    expect(hoisted.create).toHaveBeenCalledWith({
      authorUserId: 7,
      kind: 'lecture',
      entityId: 572,
      title: 'Need help',
      message: 'How does this work?',
    })
  })

  it('returns 401 when unauthenticated', async () => {
    const handle = await loadHandler()
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handle(request(validBody, null))

    expect(res.status).toBe(401)
    expect(hoisted.create).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid payload shape', async () => {
    const handle = await loadHandler()

    const res = await handle(
      request({ kind: 'bogus', entityId: 1, title: 'x', message: 'y' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_DISCUSSION_PAYLOAD',
    })
    expect(hoisted.create).not.toHaveBeenCalled()
  })

  it('returns 400 for a non-positive entity id', async () => {
    const handle = await loadHandler()

    const res = await handle(request({ ...validBody, entityId: 0 }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_ENTITY_ID',
    })
  })

  it('returns 400 for an empty title', async () => {
    const handle = await loadHandler()

    const res = await handle(request({ ...validBody, title: '   ' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_DISCUSSION_TITLE',
    })
  })

  it('maps a forbidden service error to 403', async () => {
    const handle = await loadHandler()
    hoisted.create.mockRejectedValueOnce(new Error('DISCUSSION_FORBIDDEN'))

    const res = await handle(request(validBody))

    expect(res.status).toBe(422)
    expect(res.headers.get('x-true-status')).toBe('403')
  })
})
