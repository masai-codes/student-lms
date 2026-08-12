import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getLectureFaqs: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/services/getLectureFaqs.service', () => ({
  getLectureFaqs: hoisted.getLectureFaqs,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleGetLectureFaqs', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { handleGetLectureFaqs } =
      await import('../handlers/getLectureFaqs.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleGetLectureFaqs('12')

    expect(res.status).toBe(401)
  })

  it('returns 400 when lectureId is invalid', async () => {
    const { handleGetLectureFaqs } =
      await import('../handlers/getLectureFaqs.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleGetLectureFaqs('0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
  })

  it('returns faqs for a valid lectureId', async () => {
    const { handleGetLectureFaqs } =
      await import('../handlers/getLectureFaqs.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getLectureFaqs.mockResolvedValueOnce([
      { question: 'What is X?', answer: 'X is Y.' },
    ])

    const res = await handleGetLectureFaqs('12')

    expect(res.status).toBe(200)
    expect(hoisted.getLectureFaqs).toHaveBeenCalledWith(12)
    await expect(res.json()).resolves.toEqual({
      faqs: [{ question: 'What is X?', answer: 'X is Y.' }],
    })
  })

  it('maps an unexpected error to a 500 response', async () => {
    const { handleGetLectureFaqs } =
      await import('../handlers/getLectureFaqs.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getLectureFaqs.mockRejectedValueOnce(new Error('boom'))

    const res = await handleGetLectureFaqs('12')

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_AI_TUTOR_LECTURE_FAQS',
    })
  })
})
