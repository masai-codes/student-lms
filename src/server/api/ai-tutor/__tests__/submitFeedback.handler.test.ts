import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getUserIdFromCookieHeader: vi.fn(),
  submitAiTutorFeedback: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

vi.mock('@/server/api/ai-tutor/submitAiTutorFeedback.service', () => ({
  submitAiTutorFeedback: hoisted.submitAiTutorFeedback,
}))

function postRequest(
  body: unknown,
  cookie: string | null = 'session=abc',
): Request {
  return new Request('http://localhost/api/ai-tutor/chat/feedback', {
    method: 'POST',
    headers: {
      ...(cookie ? { cookie } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleSubmitFeedback', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handleSubmitFeedback(
      postRequest(
        { lectureId: 123, chatId: 45, rating: 4, feedback: 'Great' },
        null,
      ),
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 when lectureId is invalid', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)

    const res = await handleSubmitFeedback(
      postRequest({ lectureId: 0, chatId: 45, rating: 4 }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
  })

  it('returns 400 when chatId is invalid', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)

    const res = await handleSubmitFeedback(
      postRequest({ lectureId: 123, chatId: 0, rating: 4 }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_CHAT_ID_INVALID',
    })
  })

  it('returns 400 when rating is invalid', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)

    const res = await handleSubmitFeedback(
      postRequest({ lectureId: 123, chatId: 45, rating: 0 }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_RATING_INVALID',
    })
  })

  it('submits feedback for a valid request', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)
    hoisted.submitAiTutorFeedback.mockResolvedValueOnce({
      chatId: 45,
      rating: 4,
      feedback: 'Helpful',
    })

    const res = await handleSubmitFeedback(
      postRequest({
        lectureId: 123,
        chatId: 45,
        rating: 4,
        feedback: 'Helpful',
      }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.submitAiTutorFeedback).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 123,
      chatId: 45,
      rating: 4,
      feedback: 'Helpful',
    })
    await expect(res.json()).resolves.toEqual({
      chatId: 45,
      rating: 4,
      feedback: 'Helpful',
    })
  })
})
