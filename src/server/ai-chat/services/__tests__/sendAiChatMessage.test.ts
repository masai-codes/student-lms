import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AI_CHAT_MAX_MESSAGE_LENGTH,
  sendAiChatMessage,
} from '../sendAiChatMessage'
import { requestOpenAiChatCompletion } from '@/server/ai-chat/clients/openAiChatCompletions'
import {
  appendChatHistoryEntries,
  loadOrCreateChatRow,
} from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'

vi.mock('@/server/ai-chat/clients/openAiChatCompletions', () => ({
  requestOpenAiChatCompletion: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/aiChatPracticeQuestions.repo', () => ({
  loadOrCreateChatRow: vi.fn(),
  appendChatHistoryEntries: vi.fn(),
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
  vi.mocked(loadOrCreateChatRow).mockReset()
  vi.mocked(appendChatHistoryEntries).mockReset()
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

describe('sendAiChatMessage', () => {
  it('appends a text turn and returns both messages', async () => {
    mockAccess()
    vi.mocked(loadOrCreateChatRow).mockResolvedValueOnce({
      id: 42,
      chatHistory: [],
    })
    vi.mocked(requestOpenAiChatCompletion).mockResolvedValueOnce(
      'JSX is syntax sugar.',
    )
    vi.mocked(appendChatHistoryEntries).mockResolvedValueOnce([])

    const result = await sendAiChatMessage(baseInput)

    expect(result.userMessage).toMatchObject({
      id: 'text-42-0-u',
      role: 'user',
      content: 'What is JSX?',
      source: 'text',
    })
    expect(result.assistantMessage).toMatchObject({
      id: 'text-42-0-a',
      role: 'assistant',
      content: 'JSX is syntax sugar.',
      source: 'text',
    })

    const append = vi.mocked(appendChatHistoryEntries).mock.calls[0][0]
    expect(append.rowId).toBe(42)
    expect(append.entries).toHaveLength(1)
    expect(append.entries[0]).toMatchObject({
      type: 'text',
      userMessage: 'What is JSX?',
      aiMessage: 'JSX is syntax sugar.',
    })
  })

  it('rejects an empty message before doing any work', async () => {
    await expect(
      sendAiChatMessage({ ...baseInput, message: '   ' }),
    ).rejects.toThrow('AI_CHAT_MESSAGE_EMPTY')
    expect(resolveAiTutorLectureContext).not.toHaveBeenCalled()
    expect(loadOrCreateChatRow).not.toHaveBeenCalled()
  })

  it('rejects an oversize message', async () => {
    await expect(
      sendAiChatMessage({
        ...baseInput,
        message: 'x'.repeat(AI_CHAT_MAX_MESSAGE_LENGTH + 1),
      }),
    ).rejects.toThrow('AI_CHAT_MESSAGE_TOO_LONG')
    expect(loadOrCreateChatRow).not.toHaveBeenCalled()
  })

  it('translates lecture access errors to their code', async () => {
    vi.mocked(resolveAiTutorLectureContext).mockRejectedValueOnce(
      new AiTutorLectureAccessError('AI_TUTOR_LECTURE_FORBIDDEN'),
    )

    await expect(sendAiChatMessage(baseInput)).rejects.toThrow(
      'AI_TUTOR_LECTURE_FORBIDDEN',
    )
    expect(loadOrCreateChatRow).not.toHaveBeenCalled()
  })

  it('does not append a turn when OpenAI fails', async () => {
    mockAccess()
    vi.mocked(loadOrCreateChatRow).mockResolvedValueOnce({
      id: 42,
      chatHistory: [],
    })
    vi.mocked(requestOpenAiChatCompletion).mockRejectedValueOnce(
      new Error('AI_CHAT_OPENAI_REQUEST_FAILED'),
    )

    await expect(sendAiChatMessage(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_REQUEST_FAILED',
    )
    expect(appendChatHistoryEntries).not.toHaveBeenCalled()
  })

  it('feeds prior text+voice history into the OpenAI prompt', async () => {
    mockAccess('lecture text')
    vi.mocked(loadOrCreateChatRow).mockResolvedValueOnce({
      id: 42,
      chatHistory: [
        { type: 'text', userMessage: 'q1', aiMessage: 'a1', timestamp: 100 },
        {
          type: 'audio_chat_student_speaking',
          content: 'spoken question',
          timestamp: 200,
        },
        {
          type: 'audio_chat_ai_response',
          content: 'spoken reply',
          timestamp: 300,
        },
      ],
    })
    vi.mocked(requestOpenAiChatCompletion).mockResolvedValueOnce('answer')
    vi.mocked(appendChatHistoryEntries).mockResolvedValueOnce([])

    await sendAiChatMessage(baseInput)

    const call = vi.mocked(requestOpenAiChatCompletion).mock.calls[0]
    const messages = call[0].messages
    expect(messages.some((m) => m.role === 'user' && m.content === 'q1')).toBe(
      true,
    )
    expect(
      messages.some(
        (m) => m.role === 'user' && m.content === 'spoken question',
      ),
    ).toBe(true)
    expect(
      messages.some(
        (m) => m.role === 'assistant' && m.content === 'spoken reply',
      ),
    ).toBe(true)
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: 'What is JSX?',
    })
  })

  it('uses the new entry index for stable client IDs', async () => {
    mockAccess()
    vi.mocked(loadOrCreateChatRow).mockResolvedValueOnce({
      id: 42,
      chatHistory: [
        { type: 'text', userMessage: 'q', aiMessage: 'a', timestamp: 100 },
        { type: 'text', userMessage: 'q2', aiMessage: 'a2', timestamp: 200 },
      ],
    })
    vi.mocked(requestOpenAiChatCompletion).mockResolvedValueOnce('a3')
    vi.mocked(appendChatHistoryEntries).mockResolvedValueOnce([])

    const result = await sendAiChatMessage(baseInput)

    expect(result.userMessage.id).toBe('text-42-2-u')
    expect(result.assistantMessage.id).toBe('text-42-2-a')
  })
})
