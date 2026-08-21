import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ getInterviewTopicsForUser: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/getInterviewTopics.service', () => ({
  getInterviewTopicsForUser: hoisted.getInterviewTopicsForUser,
}))

beforeEach(() => vi.clearAllMocks())

describe('handleGetInterviewTopics', () => {
  it('returns 401 when unauthenticated', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )
    const { handleGetInterviewTopics } = await import('../getTopics.handler')

    const res = await handleGetInterviewTopics()
    expect(res.status).toBe(401)
  })

  it('returns the resolved topics for the session user', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getInterviewTopicsForUser.mockResolvedValueOnce({
      domains: ['fullstack'],
      catalogTopics: [],
      curriculumTopics: [],
    })
    const { handleGetInterviewTopics } = await import('../getTopics.handler')

    const res = await handleGetInterviewTopics()
    expect(res.status).toBe(200)
    expect(hoisted.getInterviewTopicsForUser).toHaveBeenCalledWith(7)
    await expect(res.json()).resolves.toEqual({
      domains: ['fullstack'],
      catalogTopics: [],
      curriculumTopics: [],
    })
  })
})
