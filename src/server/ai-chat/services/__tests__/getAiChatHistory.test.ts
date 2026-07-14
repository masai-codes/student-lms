import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getAiChatHistory } from '../getAiChatHistory'
import { findChatRow } from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'

vi.mock('@/server/ai-chat/services/aiChatPracticeQuestions.repo', () => ({
  findChatRow: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(findChatRow).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

const baseInput = { userId: 1, lectureId: 5 }

describe('getAiChatHistory', () => {
  it('returns an empty array when no row exists', async () => {
    vi.mocked(findChatRow).mockResolvedValueOnce(null)
    await expect(getAiChatHistory(baseInput)).resolves.toEqual([])
  })

  it('projects text turns into two messages each', async () => {
    vi.mocked(findChatRow).mockResolvedValueOnce({
      id: 7,
      chatHistory: [
        {
          type: 'text',
          userMessage: 'hi',
          aiMessage: 'hello',
          timestamp: 1_000,
        },
      ],
    })

    const result = await getAiChatHistory(baseInput)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: 'text-7-0-u',
      role: 'user',
      content: 'hi',
      source: 'text',
      timestamp: 1_000,
    })
    expect(result[1]).toMatchObject({
      id: 'text-7-0-a',
      role: 'assistant',
      content: 'hello',
      source: 'text',
      timestamp: 1_001,
    })
  })

  it('projects audio entries as voice messages with the right role', async () => {
    vi.mocked(findChatRow).mockResolvedValueOnce({
      id: 9,
      chatHistory: [
        {
          type: 'audio_chat_student_speaking',
          content: 'spoken question',
          timestamp: 2_000,
        },
        {
          type: 'audio_chat_ai_response',
          content: 'spoken reply',
          timestamp: 2_500,
        },
      ],
    })

    const result = await getAiChatHistory(baseInput)
    expect(result).toEqual([
      {
        id: 'audio-9-0',
        role: 'user',
        content: 'spoken question',
        source: 'voice',
        timestamp: 2_000,
      },
      {
        id: 'audio-9-1',
        role: 'assistant',
        content: 'spoken reply',
        source: 'voice',
        timestamp: 2_500,
      },
    ])
  })

  it('preserves insertion order between mixed text + voice entries', async () => {
    vi.mocked(findChatRow).mockResolvedValueOnce({
      id: 3,
      chatHistory: [
        { type: 'text', userMessage: 'q1', aiMessage: 'a1', timestamp: 100 },
        {
          type: 'audio_chat_student_speaking',
          content: 'spoken q',
          timestamp: 200,
        },
      ],
    })

    const result = await getAiChatHistory(baseInput)
    expect(result.map((m) => m.content)).toEqual(['q1', 'a1', 'spoken q'])
    expect(result[0].source).toBe('text')
    expect(result[2].source).toBe('voice')
  })
})
