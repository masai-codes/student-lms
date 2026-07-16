import { describe, expect, it } from 'vitest'

import {
  projectHistoryToMessages,
  projectHistoryToPromptTurns,
} from '../aiChatHistoryProjection'

describe('projectHistoryToMessages', () => {
  it('expands a text turn into a user + assistant pair with stable ids', () => {
    const result = projectHistoryToMessages(
      [{ type: 'text', userMessage: 'hi', aiMessage: 'hello', timestamp: 100 }],
      9,
    )

    expect(result).toEqual([
      {
        id: 'text-9-0-u',
        role: 'user',
        content: 'hi',
        source: 'text',
        timestamp: 100,
      },
      {
        id: 'text-9-0-a',
        role: 'assistant',
        content: 'hello',
        source: 'text',
        timestamp: 101,
      },
    ])
  })

  it('maps audio entries to single voice messages of the right role', () => {
    const result = projectHistoryToMessages(
      [
        {
          type: 'audio_chat_student_speaking',
          content: 'question',
          timestamp: 200,
        },
        {
          type: 'audio_chat_ai_response',
          content: 'reply',
          timestamp: 300,
        },
      ],
      9,
    )

    expect(result).toEqual([
      {
        id: 'audio-9-0',
        role: 'user',
        content: 'question',
        source: 'voice',
        timestamp: 200,
      },
      {
        id: 'audio-9-1',
        role: 'assistant',
        content: 'reply',
        source: 'voice',
        timestamp: 300,
      },
    ])
  })

  it('returns an empty list for an empty history', () => {
    expect(projectHistoryToMessages([], 1)).toEqual([])
  })
})

describe('projectHistoryToPromptTurns', () => {
  it('flattens text turns into two prompt entries', () => {
    expect(
      projectHistoryToPromptTurns([
        { type: 'text', userMessage: 'q', aiMessage: 'a', timestamp: 0 },
      ]),
    ).toEqual([
      { role: 'user', content: 'q' },
      { role: 'assistant', content: 'a' },
    ])
  })

  it('maps audio entries to one prompt entry each', () => {
    expect(
      projectHistoryToPromptTurns([
        {
          type: 'audio_chat_student_speaking',
          content: 'spoken q',
          timestamp: 0,
        },
        {
          type: 'audio_chat_ai_response',
          content: 'spoken a',
          timestamp: 0,
        },
      ]),
    ).toEqual([
      { role: 'user', content: 'spoken q' },
      { role: 'assistant', content: 'spoken a' },
    ])
  })

  it('preserves order across mixed types', () => {
    expect(
      projectHistoryToPromptTurns([
        { type: 'text', userMessage: 'q1', aiMessage: 'a1', timestamp: 0 },
        {
          type: 'audio_chat_student_speaking',
          content: 'spoken',
          timestamp: 0,
        },
      ]),
    ).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'spoken' },
    ])
  })
})
