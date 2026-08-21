import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ listInterviewSessions: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/interviewSession.service', () => ({
  listInterviewSessions: hoisted.listInterviewSessions,
}))

beforeEach(() => vi.clearAllMocks())

describe('handleListInterviewSessions', () => {
  it('returns the sessions for the current user', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.listInterviewSessions.mockResolvedValueOnce([
      { id: 1, topicLabel: 'DSA', status: 'completed' },
    ])
    const { handleListInterviewSessions } =
      await import('../listSessions.handler')

    const res = await handleListInterviewSessions()
    expect(res.status).toBe(200)
    expect(hoisted.listInterviewSessions).toHaveBeenCalledWith(7)
    await expect(res.json()).resolves.toEqual([
      { id: 1, topicLabel: 'DSA', status: 'completed' },
    ])
  })

  it('returns 401 when unauthenticated', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )
    const { handleListInterviewSessions } =
      await import('../listSessions.handler')

    const res = await handleListInterviewSessions()
    expect(res.status).toBe(401)
  })
})
