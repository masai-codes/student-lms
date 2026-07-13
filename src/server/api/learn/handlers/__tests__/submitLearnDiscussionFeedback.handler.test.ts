import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ submit: vi.fn() }))

vi.mock('@/server/new-discussions/services/submitLearnDiscussionFeedback', () => ({
  submitLearnDiscussionFeedback: hoisted.submit,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function request(body: unknown) {
  return new Request('http://localhost/api/learn/discussions/12/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: 'session=abc' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function loadHandler() {
  const mod = await import('../submitLearnDiscussionFeedback.handler')
  return mod.handleSubmitLearnDiscussionFeedback
}

describe('submitLearnDiscussionFeedback.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.submit.mockResolvedValue({ rating: 4 })
  })

  it('submits feedback and returns the rating', async () => {
    const handle = await loadHandler()
    const res = await handle(request({ rating: 4, comment: 'Nice' }), '12')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ rating: 4 })
    expect(hoisted.submit).toHaveBeenCalledWith({
      viewerUserId: 7,
      discussionId: 12,
      rating: 4,
      comment: 'Nice',
    })
  })

  it('returns 400 when rating is not a number', async () => {
    const handle = await loadHandler()
    const res = await handle(request({ rating: 'five' }), '12')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INVALID_FEEDBACK_PAYLOAD',
    })
    expect(hoisted.submit).not.toHaveBeenCalled()
  })

  it('maps a service validation error to 400', async () => {
    const handle = await loadHandler()
    hoisted.submit.mockRejectedValueOnce(new Error('INVALID_FEEDBACK_PAYLOAD'))
    const res = await handle(request({ rating: 99 }), '12')
    expect(res.status).toBe(400)
  })
})
