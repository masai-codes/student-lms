import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getLectureFaqs: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/services/getLectureFaqs.service', () => ({
  getLectureFaqs: hoisted.getLectureFaqs,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLectureAiChatSuggestions', () => {
  it('appends the fixed suggestions after the lecture faqs', async () => {
    hoisted.getLectureFaqs.mockResolvedValueOnce([
      { question: 'What is X?', answer: 'X is Y.' },
    ])

    const { getLectureAiChatSuggestions } =
      await import('../services/getLectureAiChatSuggestions.service')
    const { AI_TUTOR_FIXED_CHAT_SUGGESTIONS } = await import('../constants')

    await expect(getLectureAiChatSuggestions(1)).resolves.toEqual([
      { icon: 'faq', question: 'What is X?' },
      ...AI_TUTOR_FIXED_CHAT_SUGGESTIONS,
    ])
  })

  it('returns only the fixed suggestions when the lecture has no faqs', async () => {
    hoisted.getLectureFaqs.mockResolvedValueOnce([])

    const { getLectureAiChatSuggestions } =
      await import('../services/getLectureAiChatSuggestions.service')
    const { AI_TUTOR_FIXED_CHAT_SUGGESTIONS } = await import('../constants')

    await expect(getLectureAiChatSuggestions(1)).resolves.toEqual(
      AI_TUTOR_FIXED_CHAT_SUGGESTIONS,
    )
  })
})
