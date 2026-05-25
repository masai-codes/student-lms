import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AI_CHAT_MAX_MESSAGE_LENGTH,
  sendAiChatMessage,
} from '../sendAiChatMessage'
import { requestOpenAiChatCompletion } from '@/server/ai-chat/clients/openAiChatCompletions'
import {
  insertAiChatMessage,
  listRecentAiChatMessagesForContext,
} from '@/server/ai-chat/services/aiChatMessages.repo'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'

vi.mock('@/server/ai-chat/clients/openAiChatCompletions', () => ({
  requestOpenAiChatCompletion: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/aiChatMessages.repo', () => ({
  insertAiChatMessage: vi.fn(),
  listRecentAiChatMessagesForContext: vi.fn(),
}))

vi.mock('@/server/ai-tutor/services/aiTutorLectureAccess', () => {
  class MockAiTutorLectureAccessError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AiTutorLectureAccessError'
    }
  }
  return {
    AiTutorLectureAccessError: MockAiTutorLectureAccessError,
    resolveAiTutorLectureContext: vi.fn(),
  }
})

beforeEach(() => {
  vi.mocked(requestOpenAiChatCompletion).mockReset()
  vi.mocked(insertAiChatMessage).mockReset()
  vi.mocked(listRecentAiChatMessagesForContext).mockReset()
  vi.mocked(resolveAiTutorLectureContext).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

const baseInput = { userId: 1, lectureId: 5, message: 'What is JSX?' }

function mockAccess(transcript = 'lecture summary'): void {
  vi.mocked(resolveAiTutorLectureContext).mockResolvedValueOnce({
    context: { lectureId: 5, title: 'React', transcript },
    participantName: 'Alice',
  })
}

function mockInsert(id: number, role: 'user' | 'assistant', content: string) {
  vi.mocked(insertAiChatMessage).mockResolvedValueOnce({
    id,
    userId: 1,
    lectureId: 5,
    role,
    source: 'text',
    content,
    sessionId: null,
    createdAt: '2026-05-25 10:00:00',
  })
}

describe('sendAiChatMessage', () => {
  it('persists user + assistant turns and returns both with timestamps', async () => {
    mockAccess()
    vi.mocked(listRecentAiChatMessagesForContext).mockResolvedValueOnce([])
    mockInsert(101, 'user', 'What is JSX?')
    vi.mocked(requestOpenAiChatCompletion).mockResolvedValueOnce(
      'JSX is syntax sugar.',
    )
    mockInsert(102, 'assistant', 'JSX is syntax sugar.')

    const result = await sendAiChatMessage(baseInput)

    expect(result.userMessage).toMatchObject({
      id: 'db-101',
      role: 'user',
      content: 'What is JSX?',
      source: 'text',
    })
    expect(result.assistantMessage).toMatchObject({
      id: 'db-102',
      role: 'assistant',
      content: 'JSX is syntax sugar.',
      source: 'text',
    })
    expect(insertAiChatMessage).toHaveBeenCalledTimes(2)
  })

  it('rejects an empty message before doing any work', async () => {
    await expect(
      sendAiChatMessage({ ...baseInput, message: '   ' }),
    ).rejects.toThrow('AI_CHAT_MESSAGE_EMPTY')
    expect(resolveAiTutorLectureContext).not.toHaveBeenCalled()
    expect(insertAiChatMessage).not.toHaveBeenCalled()
  })

  it('rejects an oversize message', async () => {
    await expect(
      sendAiChatMessage({
        ...baseInput,
        message: 'x'.repeat(AI_CHAT_MAX_MESSAGE_LENGTH + 1),
      }),
    ).rejects.toThrow('AI_CHAT_MESSAGE_TOO_LONG')
    expect(insertAiChatMessage).not.toHaveBeenCalled()
  })

  it('translates lecture access errors to their code', async () => {
    vi.mocked(resolveAiTutorLectureContext).mockRejectedValueOnce(
      new AiTutorLectureAccessError('AI_TUTOR_LECTURE_FORBIDDEN'),
    )

    await expect(sendAiChatMessage(baseInput)).rejects.toThrow(
      'AI_TUTOR_LECTURE_FORBIDDEN',
    )
    expect(insertAiChatMessage).not.toHaveBeenCalled()
  })

  it('does not write an assistant turn when OpenAI fails', async () => {
    mockAccess()
    vi.mocked(listRecentAiChatMessagesForContext).mockResolvedValueOnce([])
    mockInsert(101, 'user', 'What is JSX?')
    vi.mocked(requestOpenAiChatCompletion).mockRejectedValueOnce(
      new Error('AI_CHAT_OPENAI_REQUEST_FAILED'),
    )

    await expect(sendAiChatMessage(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_REQUEST_FAILED',
    )
    expect(insertAiChatMessage).toHaveBeenCalledTimes(1)
  })

  it('passes recent history into the prompt builder', async () => {
    mockAccess('lecture text')
    vi.mocked(listRecentAiChatMessagesForContext).mockResolvedValueOnce([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
    ])
    mockInsert(101, 'user', 'What is JSX?')
    vi.mocked(requestOpenAiChatCompletion).mockResolvedValueOnce('answer')
    mockInsert(102, 'assistant', 'answer')

    await sendAiChatMessage(baseInput)

    const call = vi.mocked(requestOpenAiChatCompletion).mock.calls[0]
    const messages = call[0].messages
    expect(messages.some(m => m.role === 'system')).toBe(true)
    expect(messages.some(m => m.role === 'user' && m.content === 'q1')).toBe(true)
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: 'What is JSX?',
    })
  })
})
