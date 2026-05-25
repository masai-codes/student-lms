import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getAiChatHistory } from '../getAiChatHistory'
import { listAiChatMessages } from '@/server/ai-chat/services/aiChatMessages.repo'
import { fetchAiTutorTranscript } from '@/server/ai-tutor/services/aiTutorSession.service'

vi.mock('@/server/ai-chat/services/aiChatMessages.repo', () => ({
  listAiChatMessages: vi.fn(),
}))

vi.mock('@/server/ai-tutor/services/aiTutorSession.service', () => ({
  fetchAiTutorTranscript: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(listAiChatMessages).mockReset()
  vi.mocked(fetchAiTutorTranscript).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

const baseInput = { userId: 1, lectureId: 5 }

describe('getAiChatHistory', () => {
  it('merges text DB rows and voice transcripts ordered by timestamp', async () => {
    vi.mocked(listAiChatMessages).mockResolvedValueOnce([
      {
        id: 1,
        userId: 1,
        lectureId: 5,
        role: 'user',
        source: 'text',
        content: 'hello',
        sessionId: null,
        createdAt: '2026-05-25 10:00:00',
      },
      {
        id: 2,
        userId: 1,
        lectureId: 5,
        role: 'assistant',
        source: 'text',
        content: 'hi',
        sessionId: null,
        createdAt: '2026-05-25 10:00:05',
      },
    ])
    vi.mocked(fetchAiTutorTranscript).mockResolvedValueOnce([
      {
        sessionId: 's-1',
        uniqueId: 'u-1',
        createdAt: '2026-05-25T10:00:02.000Z',
        transcript: [
          {
            role: 'user',
            content: 'spoken question',
            timestamp: '2026-05-25T10:00:02.000Z',
            actionType: 'user-message',
          },
        ],
      },
    ])

    const result = await getAiChatHistory(baseInput)

    expect(result.map(m => m.content)).toEqual([
      'hello',
      'spoken question',
      'hi',
    ])
    expect(result[1].source).toBe('voice')
    expect(result[0].source).toBe('text')
  })

  it('returns text history when the voice transcript fetch fails', async () => {
    vi.mocked(listAiChatMessages).mockResolvedValueOnce([
      {
        id: 1,
        userId: 1,
        lectureId: 5,
        role: 'user',
        source: 'text',
        content: 'still here',
        sessionId: null,
        createdAt: '2026-05-25 10:00:00',
      },
    ])
    vi.mocked(fetchAiTutorTranscript).mockRejectedValueOnce(
      new Error('AI_TUTOR_TOKEN_SERVER_TRANSCRIPT_FAILED'),
    )

    const result = await getAiChatHistory(baseInput)
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('still here')
  })

  it('skips voice entries with empty content', async () => {
    vi.mocked(listAiChatMessages).mockResolvedValueOnce([])
    vi.mocked(fetchAiTutorTranscript).mockResolvedValueOnce([
      {
        sessionId: 's-1',
        uniqueId: 'u-1',
        createdAt: '2026-05-25T10:00:00.000Z',
        transcript: [
          {
            role: 'user',
            content: '',
            timestamp: '2026-05-25T10:00:00.000Z',
            actionType: 'user-message',
          },
          {
            role: 'assistant',
            content: 'real reply',
            timestamp: '2026-05-25T10:00:01.000Z',
            actionType: 'system-message',
          },
        ],
      },
    ])

    const result = await getAiChatHistory(baseInput)
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('real reply')
  })

  it('returns an empty array when nothing is available', async () => {
    vi.mocked(listAiChatMessages).mockResolvedValueOnce([])
    vi.mocked(fetchAiTutorTranscript).mockResolvedValueOnce([])
    await expect(getAiChatHistory(baseInput)).resolves.toEqual([])
  })
})
