import { describe, expect, it } from 'vitest'
import { buildLectureChatUserPrompt } from '@/server/api/ai-tutor/services/buildLectureChatPrompt'

describe('buildLectureChatUserPrompt', () => {
  it('includes summary and the student question', () => {
    expect(
      buildLectureChatUserPrompt({
        summary: 'Hooks let you reuse state.',
        chatHistory: [],
        question: 'What is useState?',
      }),
    ).toBe(
      'Lecture Summary:\nHooks let you reuse state.\n\nStudent\'s Question:\nWhat is useState?',
    )
  })

  it('includes serialized chat history when present', () => {
    const prompt = buildLectureChatUserPrompt({
      summary: 'Summary text',
      chatHistory: [{ userMessage: 'Hi', aiMessage: 'Hello' }],
      question: 'Next question',
    })

    expect(prompt).toContain('Student bot chat history:')
    expect(prompt).toContain('"userMessage":"Hi"')
    expect(prompt).toContain('Student\'s Question:\nNext question')
  })
})
