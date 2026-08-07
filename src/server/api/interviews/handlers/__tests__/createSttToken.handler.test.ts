import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getInterviewSessionRowForUser: vi.fn(),
  requestInterviewSttClientSecret: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/interviewSession.service', () => ({
  getInterviewSessionRowForUser: hoisted.getInterviewSessionRowForUser,
}))

vi.mock('@/server/api/interviews/clients/openaiRealtimeClient', () => ({
  requestInterviewSttClientSecret: hoisted.requestInterviewSttClientSecret,
}))

beforeEach(() => vi.clearAllMocks())

describe('handleCreateInterviewSttToken', () => {
  it('returns 400 for a non-numeric session id', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleCreateInterviewSttToken } =
      await import('../createSttToken.handler')

    const res = await handleCreateInterviewSttToken('abc')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_SESSION_ID_INVALID',
    })
  })

  it('mints a client secret for a session owned by the user', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getInterviewSessionRowForUser.mockResolvedValueOnce({ id: 42 })
    hoisted.requestInterviewSttClientSecret.mockResolvedValueOnce({
      clientSecret: 'ek_abc',
      expiresIn: 240,
    })
    const { handleCreateInterviewSttToken } =
      await import('../createSttToken.handler')

    const res = await handleCreateInterviewSttToken('42')
    expect(res.status).toBe(200)
    expect(hoisted.getInterviewSessionRowForUser).toHaveBeenCalledWith(7, 42)
    await expect(res.json()).resolves.toEqual({
      clientSecret: 'ek_abc',
      expiresIn: 240,
    })
  })

  it('propagates session ownership errors', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.getInterviewSessionRowForUser.mockRejectedValueOnce(
      new ApiError(403, 'INTERVIEW_SESSION_FORBIDDEN'),
    )
    const { handleCreateInterviewSttToken } =
      await import('../createSttToken.handler')

    const res = await handleCreateInterviewSttToken('42')
    expect(res.headers.get('x-true-status')).toBe('403')
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_SESSION_FORBIDDEN',
    })
    expect(hoisted.requestInterviewSttClientSecret).not.toHaveBeenCalled()
  })
})
