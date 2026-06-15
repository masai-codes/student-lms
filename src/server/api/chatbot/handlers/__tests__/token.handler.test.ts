import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleCreateChatbotToken } from '@/server/api/chatbot/handlers/token.handler'
import { resolveSessionForToken } from '@/server/api/chatbot/sessions.service'
import { createChatbotToken } from '@/server/api/chatbot/token.service'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/chatbot/sessions.service', () => ({
  parseMode: (value: unknown) => (value === 'text' ? 'text' : 'voice'),
  resolveSessionForToken: vi.fn(),
}))

vi.mock('@/server/api/chatbot/token.service', () => ({
  createChatbotToken: vi.fn(),
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

function makeRequest(body: unknown = {}): Request {
  return new Request('http://localhost/api/chatbot/5/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.mocked(requireSessionUserId).mockReset()
  vi.mocked(resolveSessionForToken).mockReset()
  vi.mocked(resolveAiTutorLectureContext).mockReset()
  vi.mocked(createChatbotToken).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('handleCreateChatbotToken', () => {
  it('returns token payload with lecture transcript context', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(resolveSessionForToken).mockResolvedValueOnce({
      sessionId: 'session-1',
      lectureId: 5,
      title: 'New chat',
      lastMode: 'text',
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    })
    vi.mocked(resolveAiTutorLectureContext).mockResolvedValueOnce({
      context: {
        lectureId: 5,
        title: 'Lecture',
        transcript: 'Lecture transcript text',
      },
      participantName: 'Student',
    })
    vi.mocked(createChatbotToken).mockResolvedValueOnce({
      serverUrl: 'wss://livekit.test',
      roomName: 'chat-room',
      participantName: 'user-abc',
      participantToken: 'jwt',
      sessionId: 'session-1',
    })

    const res = await handleCreateChatbotToken(makeRequest({ mode: 'text', sessionId: 'session-1' }), '5')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { participantToken: string }
    expect(body.participantToken).toBe('jwt')
    expect(resolveAiTutorLectureContext).toHaveBeenCalledWith({ userId: 7, lectureId: 5 })
    expect(createChatbotToken).toHaveBeenCalledWith({
      mode: 'text',
      sessionId: 'session-1',
      lectureId: 5,
      lectureTranscript: 'Lecture transcript text',
    })
  })

  it('returns 403 when lecture access is forbidden', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(resolveSessionForToken).mockResolvedValueOnce({
      sessionId: 'session-1',
      lectureId: 5,
      title: 'New chat',
      lastMode: 'text',
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    })
    vi.mocked(resolveAiTutorLectureContext).mockRejectedValueOnce(
      new AiTutorLectureAccessError('AI_TUTOR_LECTURE_FORBIDDEN'),
    )

    const res = await handleCreateChatbotToken(makeRequest({ sessionId: 'session-1' }), '5')
    expect(res.status).toBe(403)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('AI_TUTOR_LECTURE_FORBIDDEN')
    expect(createChatbotToken).not.toHaveBeenCalled()
  })

  it('returns 409 when lecture transcript is unavailable', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(resolveSessionForToken).mockResolvedValueOnce({
      sessionId: 'session-1',
      lectureId: 5,
      title: 'New chat',
      lastMode: 'text',
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    })
    vi.mocked(resolveAiTutorLectureContext).mockRejectedValueOnce(
      new AiTutorLectureAccessError('AI_TUTOR_TRANSCRIPT_UNAVAILABLE'),
    )

    const res = await handleCreateChatbotToken(makeRequest({ sessionId: 'session-1' }), '5')
    expect(res.status).toBe(409)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('AI_TUTOR_TRANSCRIPT_UNAVAILABLE')
    expect(createChatbotToken).not.toHaveBeenCalled()
  })
})
