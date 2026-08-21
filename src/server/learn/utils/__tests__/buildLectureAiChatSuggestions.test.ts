import { describe, expect, it } from 'vitest'

import {
  LECTURE_AI_CHAT_SUGGESTION_DEFAULTS,
  buildLectureAiChatSuggestions,
} from '../buildLectureAiChatSuggestions'

const DEFAULTS = LECTURE_AI_CHAT_SUGGESTION_DEFAULTS

describe('buildLectureAiChatSuggestions', () => {
  it('returns only the defaults when faqsRaw is null/undefined', () => {
    expect(buildLectureAiChatSuggestions(null)).toEqual(DEFAULTS)
    expect(buildLectureAiChatSuggestions(undefined)).toEqual(DEFAULTS)
  })

  it('returns only the defaults for malformed JSON', () => {
    expect(buildLectureAiChatSuggestions('faqs')).toEqual(DEFAULTS)
    expect(buildLectureAiChatSuggestions(42)).toEqual(DEFAULTS)
    expect(buildLectureAiChatSuggestions({ question: 'x' })).toEqual(DEFAULTS)
  })

  it('places faq suggestions before the defaults', () => {
    const result = buildLectureAiChatSuggestions(
      [{ question: 'What is X?', answer: 'X is Y.' }],
      () => 0.5,
    )

    expect(result).toEqual([
      { kind: 'faq', question: 'What is X?' },
      ...DEFAULTS,
    ])
  })

  it('caps faqs at 3 before appending defaults', () => {
    const faqs = Array.from({ length: 10 }, (_, i) => ({
      question: `Question ${i}`,
      answer: `Answer ${i}`,
    }))

    const result = buildLectureAiChatSuggestions(faqs, () => 0.5)

    expect(result.filter((s) => s.kind === 'faq')).toHaveLength(3)
    expect(result.slice(-3)).toEqual(DEFAULTS)
    expect(result).toHaveLength(6)
  })

  it('never returns more than 6 suggestions', () => {
    const faqs = Array.from({ length: 20 }, (_, i) => ({
      question: `Question ${i}`,
      answer: `Answer ${i}`,
    }))

    expect(
      buildLectureAiChatSuggestions(faqs, () => 0.5).length,
    ).toBeLessThanOrEqual(6)
    expect(buildLectureAiChatSuggestions(null).length).toBeLessThanOrEqual(6)
  })

  it('shuffles faqs using the injected random function', () => {
    const faqs = [
      { question: 'A', answer: 'a' },
      { question: 'B', answer: 'b' },
      { question: 'C', answer: 'c' },
    ]
    // Descending indices → reverse order after sort.
    const values = [0.9, 0.5, 0.1]
    let i = 0
    const result = buildLectureAiChatSuggestions(faqs, () => values[i++] ?? 0)

    expect(
      result.filter((s) => s.kind === 'faq').map((s) => s.question),
    ).toEqual(['C', 'B', 'A'])
  })

  it('returns defaults-only when every faq entry is invalid', () => {
    expect(
      buildLectureAiChatSuggestions([
        null,
        { question: 'Q only' },
        { answer: 'A only' },
      ]),
    ).toEqual(DEFAULTS)
  })
})
