import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getUserIdFromCookieHeader: vi.fn(),
  getAiTutorConversation: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

vi.mock('@/server/api/ai-tutor/getAiTutorConversation.service', () => ({
  getAiTutorConversation: hoisted.getAiTutorConversation,
}))

function getRequest(
  chatId: string,
  cookie: string | null = 'session=abc',
): Request {
  return new Request(
    `http://localhost/api/ai-tutor/chat/conversations/${chatId}`,
    {
      method: 'GET',
      headers: cookie ? { cookie } : {},
    },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleGetConversation', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { handleGetConversation } =
      await import('../handlers/getConversation.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handleGetConversation(getRequest('12', null), '12')

    expect(res.status).toBe(401)
  })

  it('returns 400 when chatId is invalid', async () => {
    const { handleGetConversation } =
      await import('../handlers/getConversation.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)

    const res = await handleGetConversation(getRequest('0'), '0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_CHAT_ID_INVALID',
    })
  })

  it('returns conversation turns for a valid chatId', async () => {
    const { handleGetConversation } =
      await import('../handlers/getConversation.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)
    hoisted.getAiTutorConversation.mockResolvedValueOnce({
      chatId: 12,
      chat: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
    })

    const res = await handleGetConversation(getRequest('12'), '12')

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
