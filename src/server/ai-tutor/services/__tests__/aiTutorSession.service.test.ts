import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createAiTutorSession,
  dispatchAiTutorAgent,
  endAiTutorSession,
  fetchAiTutorTranscript,
  submitAiTutorFeedback,
} from '../aiTutorSession.service'
import {
  dispatchAgentOnTokenServer,
  endSessionOnTokenServer,
  fetchTranscriptOnTokenServer,
  generateSessionOnTokenServer,
} from '@/server/ai-tutor/clients/aiTutorTokenServer'
import { checkAiTutorDailyLimit } from '@/server/ai-tutor/services/aiTutorDailyLimit'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'
import {
  attachTokenServerSessionToRecord,
  createAiTutorSessionRecord,
  findOwnedSessionByActiveSessionId,
  listSessionsForLecture,
  markRecordFailed,
  updateLatestSessionFeedback,
} from '@/server/ai-tutor/services/aiTutorSessionRecords'
import { findChatRow } from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'
import { persistVoiceTranscriptToHistory } from '@/server/ai-chat/services/persistVoiceTranscript'


vi.mock('@/server/ai-tutor/services/aiTutorDailyLimit', () => ({
  AI_TUTOR_DAILY_LIMIT: 10,
  checkAiTutorDailyLimit: vi.fn(),
}))

vi.mock('@/server/ai-tutor/services/aiTutorLectureAccess', () => {
  class AiTutorLectureAccessError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AiTutorLectureAccessError'
    }
  }
  return {
    AiTutorLectureAccessError,
    resolveAiTutorLectureContext: vi.fn(),
  }
})

vi.mock('@/server/ai-tutor/services/aiTutorSessionRecords', () => ({
  createAiTutorSessionRecord: vi.fn(),
  attachTokenServerSessionToRecord: vi.fn(),
  markRecordFailed: vi.fn(),
  listSessionsForLecture: vi.fn(),
  updateLatestSessionFeedback: vi.fn(),
  findOwnedSessionByActiveSessionId: vi.fn(),
}))

vi.mock('@/server/ai-tutor/clients/aiTutorTokenServer', () => ({
  generateSessionOnTokenServer: vi.fn(),
  dispatchAgentOnTokenServer: vi.fn(),
  endSessionOnTokenServer: vi.fn(),
  fetchTranscriptOnTokenServer: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/aiChatPracticeQuestions.repo', () => ({
  findChatRow: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/persistVoiceTranscript', () => ({
  persistVoiceTranscriptToHistory: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(checkAiTutorDailyLimit).mockReset()
  vi.mocked(resolveAiTutorLectureContext).mockReset()
  vi.mocked(createAiTutorSessionRecord).mockReset()
  vi.mocked(attachTokenServerSessionToRecord).mockReset()
  vi.mocked(markRecordFailed).mockReset()
  vi.mocked(listSessionsForLecture).mockReset()
  vi.mocked(updateLatestSessionFeedback).mockReset()
  vi.mocked(findOwnedSessionByActiveSessionId).mockReset()
  vi.mocked(generateSessionOnTokenServer).mockReset()
  vi.mocked(dispatchAgentOnTokenServer).mockReset()
  vi.mocked(endSessionOnTokenServer).mockReset()
  vi.mocked(fetchTranscriptOnTokenServer).mockReset()
  vi.mocked(findChatRow).mockReset()
  vi.mocked(persistVoiceTranscriptToHistory).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('createAiTutorSession', () => {
  const baseInput = { userId: 1, lectureId: 5, language: 'English' }

  it('orchestrates limit check, access, DB record, and token server', async () => {
    vi.mocked(checkAiTutorDailyLimit).mockResolvedValueOnce({
      canProceed: true,
      todayCount: 1,
      message: 'ok',
      lastSessionHasFeedback: true,
    })
    vi.mocked(resolveAiTutorLectureContext).mockResolvedValueOnce({
      context: { lectureId: 5, title: 'L', transcript: 'T' },
      participantName: 'Alice',
    })
    vi.mocked(createAiTutorSessionRecord).mockResolvedValueOnce({
      id: 11,
      uniqueId: 'u-1',
      sessionId: null,
      roomName: null,
      createdAt: null,
    })
    vi.mocked(findChatRow).mockResolvedValueOnce(null)
    vi.mocked(generateSessionOnTokenServer).mockResolvedValueOnce({
      session_id: 's',
      room_name: 'r',
      url: 'wss://lk',
      token: 't',
      duration_minutes: 15,
      participant_name: 'Alice',
      unique_id: 'u-1',
    })

    await expect(createAiTutorSession(baseInput)).resolves.toEqual({
      sessionId: 's',
      roomName: 'r',
      url: 'wss://lk',
      token: 't',
      durationMinutes: 15,
      participantName: 'Alice',
      uniqueId: 'u-1',
    })

    expect(attachTokenServerSessionToRecord).toHaveBeenCalledWith({
      recordId: 11,
      sessionId: 's',
      roomName: 'r',
      url: 'wss://lk',
      token: 't',
      participantName: 'Alice',
      durationMinutes: 15,
    })
    expect(markRecordFailed).not.toHaveBeenCalled()
  })

  it('throws AI_TUTOR_DAILY_LIMIT when canProceed is false', async () => {
    vi.mocked(checkAiTutorDailyLimit).mockResolvedValueOnce({
      canProceed: false,
      todayCount: 10,
      message: 'limit',
      lastSessionHasFeedback: false,
    })

    await expect(createAiTutorSession(baseInput)).rejects.toThrow(
      'AI_TUTOR_DAILY_LIMIT',
    )
    expect(resolveAiTutorLectureContext).not.toHaveBeenCalled()
    expect(createAiTutorSessionRecord).not.toHaveBeenCalled()
  })

  it('rethrows access errors with their code', async () => {
    vi.mocked(checkAiTutorDailyLimit).mockResolvedValueOnce({
      canProceed: true,
      todayCount: 0,
      message: '',
      lastSessionHasFeedback: true,
    })
    vi.mocked(resolveAiTutorLectureContext).mockRejectedValueOnce(
      new AiTutorLectureAccessError('AI_TUTOR_LECTURE_FORBIDDEN'),
    )

    await expect(createAiTutorSession(baseInput)).rejects.toThrow(
      'AI_TUTOR_LECTURE_FORBIDDEN',
    )
  })

  it('marks record as failed when token server rejects', async () => {
    vi.mocked(checkAiTutorDailyLimit).mockResolvedValueOnce({
      canProceed: true,
      todayCount: 0,
      message: '',
      lastSessionHasFeedback: true,
    })
    vi.mocked(resolveAiTutorLectureContext).mockResolvedValueOnce({
      context: { lectureId: 5, title: 'L', transcript: 'T' },
      participantName: 'Alice',
    })
    vi.mocked(createAiTutorSessionRecord).mockResolvedValueOnce({
      id: 11,
      uniqueId: 'u-1',
      sessionId: null,
      roomName: null,
      createdAt: null,
    })
    vi.mocked(findChatRow).mockResolvedValueOnce(null)
    vi.mocked(generateSessionOnTokenServer).mockRejectedValueOnce(
      new Error('AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED'),
    )

    await expect(createAiTutorSession(baseInput)).rejects.toThrow(
      'AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED',
    )
    expect(markRecordFailed).toHaveBeenCalledWith({
      recordId: 11,
      errorMessage: 'AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED',
    })
  })
})

describe('dispatchAiTutorAgent', () => {
  it('dispatches when the user owns at least one session for the lecture', async () => {
    vi.mocked(listSessionsForLecture).mockResolvedValueOnce([
      { id: 1, sessionId: 's', uniqueId: 'u', createdAt: null },
    ])
    vi.mocked(dispatchAgentOnTokenServer).mockResolvedValueOnce(undefined)

    await expect(
      dispatchAiTutorAgent({
        userId: 1,
        lectureId: 5,
        roomName: 'room',
      }),
    ).resolves.toEqual({ success: true })

    expect(dispatchAgentOnTokenServer).toHaveBeenCalledWith({
      roomName: 'room',
      agentName: 'local-agent',
    })
  })

  it('rejects when the user has no session for the lecture', async () => {
    vi.mocked(listSessionsForLecture).mockResolvedValueOnce([])

    await expect(
      dispatchAiTutorAgent({
        userId: 1,
        lectureId: 5,
        roomName: 'room',
      }),
    ).rejects.toThrow('AI_TUTOR_SESSION_NOT_OWNED')
    expect(dispatchAgentOnTokenServer).not.toHaveBeenCalled()
  })
})

describe('endAiTutorSession', () => {
  it('ends on the token server then persists the voice transcript', async () => {
    vi.mocked(endSessionOnTokenServer).mockResolvedValueOnce(undefined)
    vi.mocked(findOwnedSessionByActiveSessionId).mockResolvedValueOnce({
      id: 22,
      lectureId: 5,
      sessionId: 's',
    })
    vi.mocked(persistVoiceTranscriptToHistory).mockResolvedValueOnce(undefined)

    await expect(
      endAiTutorSession({ userId: 1, sessionId: 's' }),
    ).resolves.toBeUndefined()

    expect(endSessionOnTokenServer).toHaveBeenCalledWith('s')
    expect(persistVoiceTranscriptToHistory).toHaveBeenCalledWith({
      userId: 1,
      lectureId: 5,
      sessionId: 's',
    })
  })

  it('skips persistence when the session record is not found', async () => {
    vi.mocked(endSessionOnTokenServer).mockResolvedValueOnce(undefined)
    vi.mocked(findOwnedSessionByActiveSessionId).mockResolvedValueOnce(null)

    await expect(
      endAiTutorSession({ userId: 1, sessionId: 's' }),
    ).resolves.toBeUndefined()
    expect(persistVoiceTranscriptToHistory).not.toHaveBeenCalled()
  })

  it('swallows persistence failures so the session is still considered ended', async () => {
    vi.mocked(endSessionOnTokenServer).mockResolvedValueOnce(undefined)
    vi.mocked(findOwnedSessionByActiveSessionId).mockResolvedValueOnce({
      id: 22,
      lectureId: 5,
      sessionId: 's',
    })
    vi.mocked(persistVoiceTranscriptToHistory).mockRejectedValueOnce(
      new Error('AI_TUTOR_TOKEN_SERVER_TRANSCRIPT_FAILED'),
    )

    await expect(
      endAiTutorSession({ userId: 1, sessionId: 's' }),
    ).resolves.toBeUndefined()
  })
})

describe('fetchAiTutorTranscript', () => {
  it('returns only sessions whose transcripts loaded successfully', async () => {
    vi.mocked(listSessionsForLecture).mockResolvedValueOnce([
      { id: 1, sessionId: 's-1', uniqueId: 'u-1', createdAt: '2026-05-25 10:00:00' },
      { id: 2, sessionId: 's-2', uniqueId: 'u-2', createdAt: '2026-05-25 11:00:00' },
    ])
    vi.mocked(fetchTranscriptOnTokenServer)
      .mockResolvedValueOnce({
        transcript: [
          {
            role: 'user',
            content: 'hi',
            timestamp: '2026-05-25T10:00:00.000Z',
            action_type: 'user-message',
          },
        ],
      })
      .mockRejectedValueOnce(new Error('AI_TUTOR_TOKEN_SERVER_TRANSCRIPT_FAILED'))

    const result = await fetchAiTutorTranscript({ userId: 1, lectureId: 5 })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ sessionId: 's-1' })
  })
})

describe('submitAiTutorFeedback', () => {
  it('throws AI_TUTOR_SESSION_NOT_FOUND when no session is updated', async () => {
    vi.mocked(updateLatestSessionFeedback).mockResolvedValueOnce(null)
    await expect(
      submitAiTutorFeedback({
        userId: 1,
        lectureId: 5,
        rating: 5,
        feedback: null,
      }),
    ).rejects.toThrow('AI_TUTOR_SESSION_NOT_FOUND')
  })

  it('resolves when feedback updates a session', async () => {
    vi.mocked(updateLatestSessionFeedback).mockResolvedValueOnce({
      sessionId: 's',
      feedbackAt: '2026-05-25 10:00:00',
    })
    await expect(
      submitAiTutorFeedback({
        userId: 1,
        lectureId: 5,
        rating: 4,
        feedback: 'good',
      }),
    ).resolves.toBeUndefined()
  })
})
