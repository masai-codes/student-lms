import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getAiTutorConversation: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/getAiTutorConversation.service', () => ({
  getAiTutorConversation: hoisted.getAiTutorConversation,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleGetConversation', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { handleGetConversation } =
      await import('../handlers/getConversation.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleGetConversation('12')

    expect(res.status).toBe(401)
  })

  it('returns 400 when chatId is invalid', async () => {
    const { handleGetConversation } =
      await import('../handlers/getConversation.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleGetConversation('0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_CHAT_ID_INVALID',
    })
  })

  it('returns conversation turns for a valid chatId', async () => {
    const { handleGetConversation } =
      await import('../handlers/getConversation.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getAiTutorConversation.mockResolvedValueOnce({
      chatId: 12,
      chat: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
    })

    const res = await handleGetConversation('12')

    expect(res.status).toBe(200)
    expect(hoisted.getAiTutorConversation).toHaveBeenCalledWith({
      userId: 7,
      chatId: 12,
    })
    await expect(res.json()).resolves.toEqual({
      chatId: 12,
      chat: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
    })
  })
})
