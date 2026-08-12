import { describe, expect, it } from 'vitest'
import {
  formatPracticeQuestionsForContext,
  namespacePracticeQuestions,
  parsePracticeQuestionsPayload,
} from '@/server/api/ai-tutor/types/practiceQuestions'

const validPayload = {
  topic: 'Array methods',
  questions: [
    {
      id: 'q1',
      question: 'What does .map return?',
      options: [
        { id: 'a', text: 'A new array' },
        { id: 'b', text: 'The original array' },
      ],
      correctOptionId: 'a',
      explanation: 'map always returns a new array.',
    },
  ],
}

describe('parsePracticeQuestionsPayload', () => {
  it('returns null for non-object or missing questions', () => {
    expect(parsePracticeQuestionsPayload(null)).toBeNull()
    expect(parsePracticeQuestionsPayload('bad')).toBeNull()
    expect(parsePracticeQuestionsPayload({})).toBeNull()
    expect(
      parsePracticeQuestionsPayload({ questions: 'not-an-array' }),
    ).toBeNull()
  })

  it('parses a well-formed payload', () => {
    expect(parsePracticeQuestionsPayload(validPayload)).toEqual(validPayload)
  })

  it('drops questions with fewer than 2 options', () => {
    const payload = {
      questions: [
        {
          id: 'q1',
          question: 'Bad question',
          options: [{ id: 'a', text: 'Only one' }],
          correctOptionId: 'a',
        },
        ...validPayload.questions,
      ],
    }
    expect(parsePracticeQuestionsPayload(payload)).toEqual({
      topic: undefined,
      questions: validPayload.questions,
    })
  })

  it('drops questions whose correctOptionId does not match any option', () => {
    const payload = {
      questions: [
        {
          id: 'q1',
          question: 'Bad question',
          options: [
            { id: 'a', text: 'First' },
            { id: 'b', text: 'Second' },
          ],
          correctOptionId: 'c',
        },
      ],
    }
    expect(parsePracticeQuestionsPayload(payload)).toBeNull()
  })

  it('returns null when every question is dropped', () => {
    expect(
      parsePracticeQuestionsPayload({
        questions: [{ id: 'q1', question: 'Q', options: [] }],
      }),
    ).toBeNull()
  })
})

describe('namespacePracticeQuestions', () => {
  it('prefixes every question and option id with the quizId', () => {
    const namespaced = namespacePracticeQuestions(validPayload, 't0')
    expect(namespaced.quizId).toBe('t0')
    expect(namespaced.questions).toEqual([
      {
        id: 't0-q1',
        question: 'What does .map return?',
        options: [
          { id: 't0-q1-a', text: 'A new array' },
          { id: 't0-q1-b', text: 'The original array' },
        ],
        correctOptionId: 't0-q1-a',
        explanation: 'map always returns a new array.',
      },
    ])
  })

  it('produces different ids for a second quiz in the same chat, avoiding collisions', () => {
    const first = namespacePracticeQuestions(validPayload, 't0')
    const second = namespacePracticeQuestions(validPayload, 't2')
    expect(first.questions[0].id).not.toBe(second.questions[0].id)
    expect(first.questions[0].options[0].id).not.toBe(
      second.questions[0].options[0].id,
    )
  })
})

describe('formatPracticeQuestionsForContext', () => {
  it('renders a compact plain-text summary with the correct answer', () => {
    expect(formatPracticeQuestionsForContext(validPayload)).toBe(
      '[Generated practice questions on Array methods]\n1. What does .map return? (Correct: A new array)',
    )
  })

  it('omits the topic clause when topic is absent', () => {
    const payload = { questions: validPayload.questions }
    expect(formatPracticeQuestionsForContext(payload)).toContain(
      '[Generated practice questions]',
    )
  })
})
