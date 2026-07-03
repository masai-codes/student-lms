import { describe, expect, it } from 'vitest'
import { parseChatHistory } from '@/server/api/ai-tutor/types/chatHistory'

describe('parseChatHistory', () => {
  it('returns an empty array for invalid values', () => {
    expect(parseChatHistory(null)).toEqual([])
    expect(parseChatHistory('bad')).toEqual([])
  })

  it('parses stored chat history entries', () => {
    expect(
      parseChatHistory([
        { userMessage: 'Hi', aiMessage: 'Hello' },
        { userMessage: 'More', aiMessage: 'Sure' },
      ]),
    ).toEqual([
      { userMessage: 'Hi', aiMessage: 'Hello' },
      { userMessage: 'More', aiMessage: 'Sure' },
    ])
  })

  it('preserves platform on stored chat history entries', () => {
    expect(
      parseChatHistory([
        { userMessage: 'Hi', aiMessage: 'Hello', platform: 'ios' },
      ]),
    ).toEqual([{ userMessage: 'Hi', aiMessage: 'Hello', platform: 'ios' }])
  })
})
