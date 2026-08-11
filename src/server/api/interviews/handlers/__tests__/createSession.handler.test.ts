import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ createInterviewSession: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/interviewSession.service', () => ({
  createInterviewSession: hoisted.createInterviewSession,
}))

function req(body: unknown) {
  return new Request('http://localhost/api/interviews/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('handleCreateInterviewSession', () => {
  it('returns 401 when unauthenticated', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )
    const { handleCreateInterviewSession } =
      await import('../createSession.handler')

    const res = await handleCreateInterviewSession(req({ topicId: 'dsa' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when topicId is missing', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleCreateInterviewSession } =
      await import('../createSession.handler')

    const res = await handleCreateInterviewSession(req({}))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_TOPIC_INVALID',
    })
  })

  it('creates a session and returns 201 with the first question', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.createInterviewSession.mockResolvedValueOnce({
      sessionId: 42,
      question: 'Tell me about arrays.',
    })
    const { handleCreateInterviewSession } =
      await import('../createSession.handler')

    const res = await handleCreateInterviewSession(req({ topicId: 'dsa' }))
    expect(res.status).toBe(201)
    expect(hoisted.createInterviewSession).toHaveBeenCalledWith(
      7,
      'dsa',
      'English',
    )
    await expect(res.json()).resolves.toEqual({
      sessionId: 42,
      question: 'Tell me about arrays.',
    })
  })

  it('propagates a 429 when the daily limit is reached', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.createInterviewSession.mockRejectedValueOnce(
      new ApiError(429, 'INTERVIEW_DAILY_LIMIT'),
    )
    const { handleCreateInterviewSession } =
      await import('../createSession.handler')

    const res = await handleCreateInterviewSession(req({ topicId: 'dsa' }))
    expect(res.status).toBe(429)
  })
})
