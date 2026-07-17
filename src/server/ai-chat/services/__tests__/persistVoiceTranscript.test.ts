import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { persistVoiceTranscriptToHistory } from '../persistVoiceTranscript'
import { fetchTranscriptOnTokenServer } from '@/server/ai-tutor/clients/aiTutorTokenServer'
import {
  appendChatHistoryEntries,
  loadOrCreateChatRow,
} from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'

vi.mock('@/server/ai-tutor/clients/aiTutorTokenServer', () => ({
  fetchTranscriptOnTokenServer: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/aiChatPracticeQuestions.repo', () => ({
  loadOrCreateChatRow: vi.fn(),
  appendChatHistoryEntries: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(fetchTranscriptOnTokenServer).mockReset()
  vi.mocked(loadOrCreateChatRow).mockReset()
  vi.mocked(appendChatHistoryEntries).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

const base = { userId: 1, lectureId: 5, sessionId: 's-1' }

describe('persistVoiceTranscriptToHistory', () => {
  it('appends each transcript entry as the correct audio history entry', async () => {
    vi.mocked(fetchTranscriptOnTokenServer).mockResolvedValueOnce({
      transcript: [
        {
          role: 'user',
          content: 'spoken question',
          timestamp: '2026-05-25T10:00:00.000Z',
        },
        {
          role: 'assistant',
          content: 'spoken reply',
          timestamp: '2026-05-25T10:00:01.000Z',
        },
      ],
    })
    vi.mocked(loadOrCreateChatRow).mockResolvedValueOnce({
      id: 99,
      chatHistory: [],
    })
    vi.mocked(appendChatHistoryEntries).mockResolvedValueOnce([])

    await persistVoiceTranscriptToHistory(base)

    const call = vi.mocked(appendChatHistoryEntries).mock.calls[0][0]
    expect(call.rowId).toBe(99)
    expect(call.entries).toEqual([
      {
        type: 'audio_chat_student_speaking',
        content: 'spoken question',
        timestamp: Date.parse('2026-05-25T10:00:00.000Z'),
      },
      {
        type: 'audio_chat_ai_response',
        content: 'spoken reply',
        timestamp: Date.parse('2026-05-25T10:00:01.000Z'),
      },
    ])
  })

  it('skips empty entries and short-circuits when no usable entries remain', async () => {
    vi.mocked(fetchTranscriptOnTokenServer).mockResolvedValueOnce({
      transcript: [
        {
          role: 'user',
          content: '',
          timestamp: '2026-05-25T10:00:00.000Z',
        },
      ],
    })

    await persistVoiceTranscriptToHistory(base)
    expect(loadOrCreateChatRow).not.toHaveBeenCalled()
    expect(appendChatHistoryEntries).not.toHaveBeenCalled()
  })

  it('falls back to current time when transcript timestamp is invalid', async () => {
    vi.mocked(fetchTranscriptOnTokenServer).mockResolvedValueOnce({
      transcript: [{ role: 'user', content: 'q', timestamp: 'not-a-date' }],
    })
    vi.mocked(loadOrCreateChatRow).mockResolvedValueOnce({
      id: 1,
      chatHistory: [],
    })

    const before = Date.now()
    await persistVoiceTranscriptToHistory(base)
    const after = Date.now()

    const entries = vi.mocked(appendChatHistoryEntries).mock.calls[0][0].entries
    expect(entries).toHaveLength(1)
    expect(entries[0].timestamp).toBeGreaterThanOrEqual(before)
    expect(entries[0].timestamp).toBeLessThanOrEqual(after)
  })
})
