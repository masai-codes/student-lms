import { describe, expect, it } from 'vitest'

import {
  AI_CHAT_SYSTEM_PROMPT,
  buildChatPromptMessages,
} from '../buildChatPrompt'

describe('buildChatPromptMessages', () => {
  const baseInput = {
    lectureTitle: 'Intro to React',
    lectureSummary: 'React is a UI library.',
    history: [] as Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: 'What is JSX?',
  }

  it('puts the AI chat system prompt first and includes the lecture summary', () => {
    const result = buildChatPromptMessages(baseInput)
    expect(result[0].role).toBe('system')
    expect(result[0].content).toContain(AI_CHAT_SYSTEM_PROMPT)
    expect(result[0].content).toContain('Intro to React')
    expect(result[0].content).toContain('React is a UI library.')
  })

  it('appends the user message at the end', () => {
    const result = buildChatPromptMessages(baseInput)
    const last = result[result.length - 1]
    expect(last).toEqual({ role: 'user', content: 'What is JSX?' })
  })

  it('includes the most recent history entries between system and user message', () => {
    const result = buildChatPromptMessages({
      ...baseInput,
      history: [
        { role: 'user', content: 'first question' },
        { role: 'assistant', content: 'first answer' },
        { role: 'user', content: 'second question' },
        { role: 'assistant', content: 'second answer' },
      ],
    })

    expect(result).toHaveLength(6)
    expect(result.slice(1, 5)).toEqual([
      { role: 'user', content: 'first question' },
      { role: 'assistant', content: 'first answer' },
      { role: 'user', content: 'second question' },
      { role: 'assistant', content: 'second answer' },
    ])
  })

  it('truncates oversize lecture summaries and signals truncation', () => {
    const long = 'a'.repeat(20_000)
    const result = buildChatPromptMessages({
      ...baseInput,
      lectureSummary: long,
    })
    expect(result[0].content).toContain('…')
    expect(result[0].content.length).toBeLessThan(long.length + 2_000)
  })

  it('keeps only the last 16 history turns when more are provided', () => {
    const longHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      Array.from({ length: 40 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `m-${i}`,
      }))

    const result = buildChatPromptMessages({
      ...baseInput,
      history: longHistory,
    })

    const middle = result.slice(1, -1)
    expect(middle).toHaveLength(16)
    expect(middle[0]).toEqual({ role: 'user', content: 'm-24' })
    expect(middle[middle.length - 1]).toEqual({
      role: 'assistant',
      content: 'm-39',
    })
  })
})
