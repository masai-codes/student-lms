import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    userId: 'ai_chat_practice_questions.user_id',
    chatHistory: 'ai_chat_practice_questions.chat_history',
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

const existingHistory = [
  { userMessage: 'Explain hooks', aiMessage: 'Sure, hooks let you...' },
  {
    userMessage: 'Give me practice questions',
    aiMessage: '',
    practiceQuestions: {
      quizId: '4-t1',
      questions: [
        {
          id: '4-t1-q1',
          question: 'What does useState return?',
          options: [
            { id: '4-t1-q1-a', text: 'A tuple' },
            { id: '4-t1-q1-b', text: 'An object' },
          ],
          correctOptionId: '4-t1-q1-a',
        },
      ],
    },
  },
]

describe('submitPracticeQuestionAnswers', () => {
  it('returns 404 when the chat thread is not found', async () => {
    const { submitPracticeQuestionAnswers } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))

    await expect(
      submitPracticeQuestionAnswers({
        userId: 1,
        chatId: 4,
        quizId: '4-t1',
        answers: { '4-t1-q1': '4-t1-q1-a' },
      }),
    ).rejects.toMatchObject({ code: 'AI_TUTOR_CHAT_NOT_FOUND' })
  })

  it('returns 404 when no history entry matches the quizId', async () => {
    const { submitPracticeQuestionAnswers } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([{ id: 4, chatHistory: existingHistory }]),
    )

    await expect(
      submitPracticeQuestionAnswers({
        userId: 1,
        chatId: 4,
        quizId: 'unknown-quiz',
        answers: {},
      }),
    ).rejects.toMatchObject({ code: 'AI_TUTOR_QUIZ_NOT_FOUND' })
  })

  it('persists answers onto the matching history entry, leaving other entries untouched', async () => {
    const { submitPracticeQuestionAnswers } =
      await import('../services/aiChatPracticeQuestions.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([{ id: 4, chatHistory: existingHistory }]),
    )
    const { set, where } = mockUpdate()

    await submitPracticeQuestionAnswers({
      userId: 1,
      chatId: 4,
      quizId: '4-t1',
      answers: { '4-t1-q1': '4-t1-q1-b' },
    })

    expect(set).toHaveBeenCalledWith({
      chatHistory: [
        existingHistory[0],
        {
          ...existingHistory[1],
          practiceQuestions: {
            ...existingHistory[1].practiceQuestions,
            answers: { '4-t1-q1': '4-t1-q1-b' },
          },
        },
      ],
      updatedAt: expect.any(String),
    })
    expect(where).toHaveBeenCalled()
  })
})
