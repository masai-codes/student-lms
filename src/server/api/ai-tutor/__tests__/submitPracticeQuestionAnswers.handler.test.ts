import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  submitPracticeQuestionAnswers: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock(
  '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service',
  () => ({
    submitPracticeQuestionAnswers: hoisted.submitPracticeQuestionAnswers,
  }),
)

function postRequest(body: unknown, cookie: string | null = 'session=abc') {
  return new Request(
    'http://localhost/api/ai-tutor/chat/practice-questions/answers',
    {
      method: 'POST',
      headers: {
        ...(cookie ? { cookie } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleSubmitPracticeQuestionAnswers', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    const { handleSubmitPracticeQuestionAnswers } =
      await import('../handlers/submitPracticeQuestionAnswers.handler')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleSubmitPracticeQuestionAnswers(
      postRequest({ chatId: 4, quizId: 'q', answers: {} }, null),
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 when chatId is invalid', async () => {
    const { handleSubmitPracticeQuestionAnswers } =
      await import('../handlers/submitPracticeQuestionAnswers.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSubmitPracticeQuestionAnswers(
      postRequest({ chatId: 0, quizId: 'q', answers: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_CHAT_ID_INVALID',
    })
  })

  it('returns 400 when quizId is missing', async () => {
    const { handleSubmitPracticeQuestionAnswers } =
      await import('../handlers/submitPracticeQuestionAnswers.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSubmitPracticeQuestionAnswers(
      postRequest({ chatId: 4, answers: {} }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_QUIZ_ID_INVALID',
    })
  })

  it('returns 400 when answers is not a string map', async () => {
    const { handleSubmitPracticeQuestionAnswers } =
      await import('../handlers/submitPracticeQuestionAnswers.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSubmitPracticeQuestionAnswers(
      postRequest({ chatId: 4, quizId: 'q', answers: { q1: 5 } }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_QUIZ_ANSWERS_INVALID',
    })
  })

  it('submits parsed answers for the authenticated user', async () => {
    const { handleSubmitPracticeQuestionAnswers } =
      await import('../handlers/submitPracticeQuestionAnswers.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitPracticeQuestionAnswers.mockResolvedValueOnce(undefined)

    const res = await handleSubmitPracticeQuestionAnswers(
      postRequest({
        chatId: 4,
        quizId: '4-t1',
        answers: { '4-t1-q1': '4-t1-q1-a' },
      }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.submitPracticeQuestionAnswers).toHaveBeenCalledWith({
      userId: 7,
      chatId: 4,
      quizId: '4-t1',
      answers: { '4-t1-q1': '4-t1-q1-a' },
    })
  })
})
