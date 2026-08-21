import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ getInterviewSession: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/interviewSession.service', () => ({
  getInterviewSession: hoisted.getInterviewSession,
}))

beforeEach(() => vi.clearAllMocks())

describe('handleGetInterviewSession', () => {
  it('returns 400 for a non-numeric session id', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleGetInterviewSession } = await import('../getSession.handler')

    const res = await handleGetInterviewSession('abc')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_SESSION_ID_INVALID',
    })
  })

  it('returns the session for a valid id', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getInterviewSession.mockResolvedValueOnce({
      id: 42,
      status: 'in_progress',
    })
    const { handleGetInterviewSession } = await import('../getSession.handler')

    const res = await handleGetInterviewSession('42')
    expect(res.status).toBe(200)
    expect(hoisted.getInterviewSession).toHaveBeenCalledWith(7, 42)
  })

  it('returns the true 404 status (via the CloudFront-safe header) when the session does not exist', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.getInterviewSession.mockRejectedValueOnce(
      new ApiError(404, 'INTERVIEW_SESSION_NOT_FOUND'),
    )
    const { handleGetInterviewSession } = await import('../getSession.handler')

    const res = await handleGetInterviewSession('42')
    expect(res.headers.get('x-true-status')).toBe('404')
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_SESSION_NOT_FOUND',
    })
  })
})
