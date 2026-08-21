import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_TUTOR_FEEDBACK_MAX_LENGTH } from '@/server/api/ai-tutor/constants'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/db/schema', () => ({
  aiChatPracticeQuestions: {
    id: 'ai_chat_practice_questions.id',
    lectureId: 'ai_chat_practice_questions.lecture_id',
    userId: 'ai_chat_practice_questions.user_id',
    rating: 'ai_chat_practice_questions.rating',
    feedback: 'ai_chat_practice_questions.feedback',
    feedbackTime: 'ai_chat_practice_questions.feedback_time',
    ratedFrom: 'ai_chat_practice_questions.rated_from',
    updatedAt: 'ai_chat_practice_questions.updated_at',
  },
}))

function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

function mockUpdate() {
  const where = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn().mockReturnValue({ where })
  hoisted.dbUpdate.mockReturnValue({ set })
  return { set, where }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitChatPracticeFeedback', () => {
  it('rejects an out-of-range rating', async () => {
    const { submitChatPracticeFeedback } =
      await import('../services/aiChatPracticeQuestions.service')

    await expect(
      submitChatPracticeFeedback({
        userId: 1,
        lectureId: 9,
        chatId: 4,
        rating: 7,
        feedback: null,
        platform: 'web',
      }),
    ).rejects.toMatchObject({ code: 'AI_TUTOR_RATING_INVALID' })
  })

  it('accepts stored web and mobile rating ranges', async () => {
    const { submitChatPracticeFeedback } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 4 }]))
    const webUpdate = mockUpdate()

    await submitChatPracticeFeedback({
      userId: 1,
      lectureId: 9,
      chatId: 4,
      rating: 0,
      feedback: 'web',
      platform: 'web',
    })

    expect(webUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 0,
        feedback: 'web',
        ratedFrom: 'web',
      }),
    )

    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 4 }]))
    const mobileUpdate = mockUpdate()

    await submitChatPracticeFeedback({
      userId: 1,
      lectureId: 9,
      chatId: 4,
      rating: 6,
      feedback: 'ios-Great',
      platform: 'ios',
    })

    expect(mobileUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 6,
        feedback: 'ios-Great',
        ratedFrom: 'ios',
      }),
    )
  })

  it('returns 404 when the chat thread is not found', async () => {
    const { submitChatPracticeFeedback } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))

    await expect(
      submitChatPracticeFeedback({
        userId: 1,
        lectureId: 9,
        chatId: 4,
        rating: 4,
        feedback: null,
        platform: 'web',
      }),
    ).rejects.toMatchObject({ code: 'AI_TUTOR_CHAT_NOT_FOUND' })
  })

  it('persists rating and trimmed feedback', async () => {
    const { submitChatPracticeFeedback } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 4 }]))
    const { set, where } = mockUpdate()

    const longFeedback = ` ${'a'.repeat(AI_TUTOR_FEEDBACK_MAX_LENGTH + 10)} `
    const result = await submitChatPracticeFeedback({
      userId: 1,
      lectureId: 9,
      chatId: 4,
      rating: 5,
      feedback: longFeedback,
      platform: 'web',
    })

    expect(result).toEqual({
      chatId: 4,
      rating: 5,
      feedback: 'a'.repeat(AI_TUTOR_FEEDBACK_MAX_LENGTH),
    })
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 5,
        feedback: 'a'.repeat(AI_TUTOR_FEEDBACK_MAX_LENGTH),
        feedbackTime: expect.any(String),
        updatedAt: expect.any(String),
      }),
    )
    expect(where).toHaveBeenCalled()
  })

  it('stores null feedback when text is blank', async () => {
    const { submitChatPracticeFeedback } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 4 }]))
    const { set } = mockUpdate()

    const result = await submitChatPracticeFeedback({
      userId: 1,
      lectureId: 9,
      chatId: 4,
      rating: 3,
      feedback: '   ',
      platform: 'web',
    })

    expect(result).toEqual({
      chatId: 4,
      rating: 3,
      feedback: null,
    })
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 3,
        feedback: null,
      }),
    )
  })

  it('stores platform-only feedback without trimming it away', async () => {
    const { submitChatPracticeFeedback } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 4 }]))
    const { set } = mockUpdate()

    const result = await submitChatPracticeFeedback({
      userId: 1,
      lectureId: 9,
      chatId: 4,
      rating: 1,
      feedback: 'web',
      platform: 'web',
    })

    expect(result).toEqual({
      chatId: 4,
      rating: 1,
      feedback: 'web',
    })
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 1,
        feedback: 'web',
      }),
    )
  })
})
