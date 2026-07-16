import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleGetAiChatHistory } from '../getHistory.handler'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAiChatHistory } from '@/server/ai-chat/services/getAiChatHistory'
import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/getAiChatHistory', () => ({
  getAiChatHistory: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(requireSessionUserId).mockReset()
  vi.mocked(getAiChatHistory).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('handleGetAiChatHistory', () => {
  it('returns 200 with the merged messages on success', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(getAiChatHistory).mockResolvedValueOnce([
      {
        id: 'db-1',
        role: 'user',
        content: 'hi',
        source: 'text',
        timestamp: 1,
      },
    ])

    const res = await handleGetAiChatHistory('5')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { messages: Array<{ content: string }> }
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].content).toBe('hi')
    expect(getAiChatHistory).toHaveBeenCalledWith({ userId: 7, lectureId: 5 })
  })

  it('returns 401 when unauthenticated', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleGetAiChatHistory('5')
    expect(res.status).toBe(401)
    expect(getAiChatHistory).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid lecture id', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const res = await handleGetAiChatHistory('abc')
    expect(res.status).toBe(400)
  })

  it('maps service errors to the correct status code', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(getAiChatHistory).mockRejectedValueOnce(
      new Error('AI_TUTOR_LECTURE_FORBIDDEN'),
    )
    const res = await handleGetAiChatHistory('5')
    // 403 ships on the CloudFront-safe wire status; the true status is in the header.
    expect(resolveTrueStatus(res)).toBe(403)
  })
})
