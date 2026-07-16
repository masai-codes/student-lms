import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  submitAiTutorFeedback: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
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
  vi.mocked(requireSessionUserId).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleSubmitFeedback', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleSubmitFeedback(
      postRequest(
        { lectureId: 123, chatId: 45, rating: 1, feedback: 'Great' },
        null,
      ),
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 when lectureId is invalid', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSubmitFeedback(
      postRequest({ lectureId: 0, chatId: 45, rating: 1 }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
  })

  it('returns 400 when chatId is invalid', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSubmitFeedback(
      postRequest({ lectureId: 123, chatId: 0, rating: 1 }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_CHAT_ID_INVALID',
    })
  })

  it('returns 400 when platform is invalid', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSubmitFeedback(
      postRequest({
        lectureId: 123,
        chatId: 45,
        rating: 4,
        platform: 'windows',
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_PLATFORM_INVALID',
    })
  })

  it('defaults to app feedback with a 0/1 rating and platform prefix', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitAiTutorFeedback.mockResolvedValueOnce({
      chatId: 45,
      rating: 1,
      feedback: 'app-Helpful',
    })

    const res = await handleSubmitFeedback(
      postRequest({
        lectureId: 123,
        chatId: 45,
        rating: 1,
        feedback: 'Helpful',
      }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.submitAiTutorFeedback).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 123,
      chatId: 45,
      rating: 1,
      feedback: 'app-Helpful',
    })
    await expect(res.json()).resolves.toEqual({
      chatId: 45,
      rating: 1,
      feedback: 'app-Helpful',
    })
  })

  it('passes through mobile ratings and prefixes feedback with platform', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitAiTutorFeedback.mockResolvedValueOnce({
      chatId: 45,
      rating: 4,
      feedback: 'ios-Helpful',
    })

    const res = await handleSubmitFeedback(
      postRequest({
        lectureId: 123,
        chatId: 45,
        rating: 4,
        feedback: 'Helpful',
        platform: 'ios',
      }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.submitAiTutorFeedback).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 123,
      chatId: 45,
      rating: 4,
      feedback: 'ios-Helpful',
    })
  })

  it('stores only the platform when feedback text is blank', async () => {
    const { handleSubmitFeedback } =
      await import('../handlers/submitFeedback.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitAiTutorFeedback.mockResolvedValueOnce({
      chatId: 45,
      rating: 1,
      feedback: 'android',
    })

    const res = await handleSubmitFeedback(
      postRequest({
        lectureId: 123,
        chatId: 45,
        rating: 1,
        platform: 'android',
      }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.submitAiTutorFeedback).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 123,
      chatId: 45,
      rating: 1,
      feedback: 'android',
    })
  })
})
