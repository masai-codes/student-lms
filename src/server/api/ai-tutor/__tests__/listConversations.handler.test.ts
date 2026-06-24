import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getUserIdFromCookieHeader: vi.fn(),
  listAiTutorConversations: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

vi.mock('@/server/api/ai-tutor/listAiTutorConversations.service', () => ({
  listAiTutorConversations: hoisted.listAiTutorConversations,
}))

function getRequest(
  lectureId: string | null,
  cookie: string | null = 'session=abc',
): Request {
  const query = lectureId == null ? '' : `?lectureId=${lectureId}`
  return new Request(
    `http://localhost/api/ai-tutor/chat/conversations${query}`,
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

describe('handleListConversations', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { handleListConversations } =
      await import('../handlers/listConversations.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handleListConversations(getRequest('12', null))

    expect(res.status).toBe(401)
  })

  it('returns 400 when lectureId is invalid', async () => {
    const { handleListConversations } =
      await import('../handlers/listConversations.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)

    const res = await handleListConversations(getRequest('0'))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
  })

  it('returns conversations for a valid lectureId', async () => {
    const { handleListConversations } =
      await import('../handlers/listConversations.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)
    hoisted.listAiTutorConversations.mockResolvedValueOnce({
      conversations: [
        {
          chatId: 3,
          title: 'What is useState?',
          updatedAt: '2026-06-22 10:00:00',
        },
      ],
    })

    const res = await handleListConversations(getRequest('99'))

    expect(res.status).toBe(200)
    expect(hoisted.listAiTutorConversations).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 99,
    })
    await expect(res.json()).resolves.toEqual({
      conversations: [
        {
          chatId: 3,
          title: 'What is useState?',
          updatedAt: '2026-06-22 10:00:00',
        },
      ],
    })
  })
})
