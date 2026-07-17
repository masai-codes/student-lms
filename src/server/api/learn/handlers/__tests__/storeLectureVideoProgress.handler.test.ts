import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  store: vi.fn(),
}))

// Mocked so the handler unit test does not pull in the DB layer (`@/db`).
vi.mock('@/server/video-attendance/services/storeVideoProgress', () => ({
  storeVideoProgress: hoisted.store,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

const validBody = {
  totalDuration: 600,
  intervals: [{ start: 0, end: 30 }],
}

function request(body: unknown, cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/lectures/572/video-progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function loadHandler() {
  const mod = await import('../storeLectureVideoProgress.handler')
  return mod.handleStoreLectureVideoProgress
}

describe('storeLectureVideoProgress.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.store.mockResolvedValue(true)
  })

  it('stores progress and returns ok: true', async () => {
    const handle = await loadHandler()
    const res = await handle(request(validBody), '572')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(hoisted.store).toHaveBeenCalledWith({
      lectureId: 572,
      userId: 7,
      totalDuration: 600,
      intervals: [{ start: 0, end: 30 }],
      sessionToken: undefined,
    })
  })

  it('forwards an optional sessionToken', async () => {
    const handle = await loadHandler()
    await handle(request({ ...validBody, sessionToken: 'tok' }), '572')

    expect(hoisted.store).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: 'tok' }),
    )
  })

  it('returns ok: false when the upstream service fails', async () => {
    const handle = await loadHandler()
    hoisted.store.mockResolvedValueOnce(false)

    const res = await handle(request(validBody), '572')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: false })
  })

  it('returns 401 when unauthenticated', async () => {
    const handle = await loadHandler()
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handle(request(validBody, null), '572')

    expect(res.status).toBe(401)
    expect(hoisted.store).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid lecture id', async () => {
    const handle = await loadHandler()

    const res = await handle(request(validBody), '0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_LECTURE_ID',
    })
    expect(hoisted.store).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid body shape', async () => {
    const handle = await loadHandler()

    const res = await handle(request({ totalDuration: 'nope' }), '572')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_VIDEO_PROGRESS_PAYLOAD',
    })
    expect(hoisted.store).not.toHaveBeenCalled()
  })

  it('treats a missing body as invalid', async () => {
    const handle = await loadHandler()

    const res = await handle(request(undefined), '572')

    expect(res.status).toBe(400)
    expect(hoisted.store).not.toHaveBeenCalled()
  })
})
