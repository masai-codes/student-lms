import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  submit: vi.fn(),
}))

vi.mock('@/server/learn/services/lectureFeedback.service', () => ({
  submitLectureFeedback: hoisted.submit,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function request(body: unknown, cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/lectures/572/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function loadHandler() {
  const mod = await import('../submitLectureFeedback.handler')
  return mod.handleSubmitLectureFeedback
}

describe('submitLectureFeedback.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.submit.mockResolvedValue({
      mode: 'zef',
      rating: 5,
      text: 'Nice',
      tags: [],
    })
  })

  it('submits feedback and returns the saved record', async () => {
    const handle = await loadHandler()
    const res = await handle(
      request({
        rating: 5,
        feedback: 'Nice',
        tags: ['Great examples', 'Very engaging'],
      }),
      '572',
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      mode: 'zef',
      rating: 5,
      text: 'Nice',
      tags: [],
    })
    expect(hoisted.submit).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 572,
      rating: 5,
      text: 'Nice',
      tags: ['Great examples', 'Very engaging'],
    })
  })

  it('normalizes blank feedback text to null', async () => {
    const handle = await loadHandler()
    await handle(request({ rating: 4, feedback: '   ' }), '572')

    expect(hoisted.submit).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4, text: null, tags: [] }),
    )
  })

  it('dedupes repeated tags', async () => {
    const handle = await loadHandler()
    await handle(
      request({ rating: 1, tags: ['Too fast', 'Too fast', 'Too slow'] }),
      '572',
    )

    expect(hoisted.submit).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['Too fast', 'Too slow'] }),
    )
  })

  it('returns 400 for a tag not in the known set', async () => {
    const handle = await loadHandler()
    const res = await handle(
      request({ rating: 1, tags: ['Not a real tag'] }),
      '572',
    )

    expect(res.status).toBe(400)
    expect(hoisted.submit).not.toHaveBeenCalled()
  })

  it('returns 401 when unauthenticated', async () => {
    const handle = await loadHandler()
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handle(request({ rating: 5 }, null), '572')

    expect(res.status).toBe(401)
    expect(hoisted.submit).not.toHaveBeenCalled()
  })

  it('returns 400 for an out-of-range rating', async () => {
    const handle = await loadHandler()

    const res = await handle(request({ rating: 6 }), '572')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_FEEDBACK_PAYLOAD',
    })
    expect(hoisted.submit).not.toHaveBeenCalled()
  })

  it('maps a closed-window service error to 409', async () => {
    const handle = await loadHandler()
    hoisted.submit.mockRejectedValueOnce(new Error('FEEDBACK_WINDOW_CLOSED'))

    const res = await handle(request({ rating: 5 }), '572')

    expect(res.status).toBe(409)
  })
})
