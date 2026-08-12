import { describe, expect, it } from 'vitest'

import { parseLectureAiFaqs } from '@/server/api/ai-tutor/types/lectureFaqs'

describe('parseLectureAiFaqs', () => {
  it('returns an empty list for null/non-array values', () => {
    expect(parseLectureAiFaqs(null)).toEqual([])
    expect(parseLectureAiFaqs(undefined)).toEqual([])
    expect(parseLectureAiFaqs('faqs')).toEqual([])
    expect(parseLectureAiFaqs(42)).toEqual([])
    expect(parseLectureAiFaqs({ question: 'x' })).toEqual([])
  })

  it('skips non-object entries and entries missing question/answer', () => {
    expect(
      parseLectureAiFaqs([
        null,
        'nope',
        { question: 'Q only' },
        { answer: 'A only' },
        { question: '   ', answer: 'A' },
        { question: 'Q', answer: 42 },
      ]),
    ).toEqual([])
  })

  it('parses valid faq entries, trimming whitespace', () => {
    expect(
      parseLectureAiFaqs([
        {
          question: '  What is blue-green deployment?  ',
          answer: '  It uses two environments.  ',
        },
      ]),
    ).toEqual([
      {
        question: 'What is blue-green deployment?',
        answer: 'It uses two environments.',
      },
    ])
  })

  it('caps the number of faqs at the configured limit', () => {
    const faqs = Array.from({ length: 10 }, (_, i) => ({
      question: `Question ${i}`,
      answer: `Answer ${i}`,
    }))

    const result = parseLectureAiFaqs(faqs)
    expect(result).toHaveLength(3)
    expect(result[0].question).toBe('Question 0')
  })
})
