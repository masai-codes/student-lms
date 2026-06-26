import { describe, expect, it } from 'vitest'
import { AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT } from '@/server/api/ai-tutor/constants'
import {
  buildLectureChatMessages,
  buildLectureChatSystemPrompt,
} from '@/server/api/ai-tutor/services/buildLectureChatPrompt'

describe('buildLectureChatSystemPrompt', () => {
  it('appends the lecture summary to the base system prompt', () => {
    expect(buildLectureChatSystemPrompt('Hooks let you reuse state.')).toBe(
      `${AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT}

## Lecture content (summary)
Hooks let you reuse state.`,
    )
  })
})

describe('buildLectureChatMessages', () => {
  it('returns only the current question when history is empty', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [],
        question: 'What is useState?',
      }),
    ).toEqual([{ role: 'user', content: 'What is useState?' }])
  })

  it('maps prior turns to user and assistant messages before the question', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [{ userMessage: 'Hi', aiMessage: 'Hello' }],
        question: 'Next question',
      }),
    ).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Next question' },
    ])
  })

  it('skips empty history entries', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [{ userMessage: '', aiMessage: 'Hello' }],
        question: 'Next question',
      }),
    ).toEqual([
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Next question' },
    ])
  })
})
