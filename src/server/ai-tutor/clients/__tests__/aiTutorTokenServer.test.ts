import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dispatchAgentOnTokenServer,
  endSessionOnTokenServer,
  fetchTranscriptOnTokenServer,
  generateSessionOnTokenServer,
} from '../aiTutorTokenServer'

const ORIGINAL_BASE = process.env.TOKEN_SERVER_URL
const ORIGINAL_TIMEOUT = process.env.TOKEN_SERVER_TIMEOUT_MS

beforeEach(() => {
  process.env.TOKEN_SERVER_URL = 'http://lk.test'
  process.env.TOKEN_SERVER_TIMEOUT_MS = '5000'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (ORIGINAL_BASE === undefined) delete process.env.TOKEN_SERVER_URL
  else process.env.TOKEN_SERVER_URL = ORIGINAL_BASE
  if (ORIGINAL_TIMEOUT === undefined)
    delete process.env.TOKEN_SERVER_TIMEOUT_MS
  else process.env.TOKEN_SERVER_TIMEOUT_MS = ORIGINAL_TIMEOUT
})

describe('generateSessionOnTokenServer', () => {
  it('returns the normalized session payload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        session_id: 's',
        room_name: 'r',
        url: 'wss://lk',
        token: 't',
        unique_id: 'u',
        participant_name: 'p',
        duration_minutes: 15,
      }),
    } as Response)

    await expect(
      generateSessionOnTokenServer({
        participantName: 'p',
        language: 'English',
        uniqueId: 'u',
        lectureId: 7,
        lectureTranscript: 'transcript',
        durationMinutes: 15,
      }),
    ).resolves.toEqual({
      session_id: 's',
      room_name: 'r',
      url: 'wss://lk',
      token: 't',
      unique_id: 'u',
      participant_name: 'p',
      duration_minutes: 15,
    })
  })

  it('throws an invalid-response error when fields are missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_id: 's' }),
    } as Response)

    await expect(
      generateSessionOnTokenServer({
        participantName: 'p',
        language: 'English',
        uniqueId: 'u',
        lectureId: 7,
        lectureTranscript: '',
        durationMinutes: 15,
      }),
    ).rejects.toThrow('AI_TUTOR_TOKEN_SERVER_INVALID_RESPONSE')
  })

  it('maps non-2xx responses to a typed error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response)

    await expect(
      generateSessionOnTokenServer({
        participantName: 'p',
        language: 'English',
        uniqueId: 'u',
        lectureId: 1,
        lectureTranscript: '',
        durationMinutes: 15,
      }),
    ).rejects.toThrow('AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED')
  })

  it('throws a configuration error when the base URL is missing', async () => {
    delete process.env.TOKEN_SERVER_URL
    await expect(
      generateSessionOnTokenServer({
        participantName: 'p',
        language: 'English',
        uniqueId: 'u',
        lectureId: 1,
        lectureTranscript: '',
        durationMinutes: 15,
      }),
    ).rejects.toThrow('AI_TUTOR_TOKEN_SERVER_NOT_CONFIGURED')
  })
})

describe('dispatchAgentOnTokenServer', () => {
  it('resolves on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)
    await expect(
      dispatchAgentOnTokenServer({ roomName: 'r', agentName: 'a' }),
    ).resolves.toBeUndefined()
  })

  it('throws on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response)
    await expect(
      dispatchAgentOnTokenServer({ roomName: 'r', agentName: 'a' }),
    ).rejects.toThrow('AI_TUTOR_TOKEN_SERVER_DISPATCH_FAILED')
  })
})

describe('endSessionOnTokenServer', () => {
  it('resolves on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)
    await expect(endSessionOnTokenServer('s')).resolves.toBeUndefined()
  })
})

describe('fetchTranscriptOnTokenServer', () => {
  it('returns parsed transcript', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transcript: [
          {
            role: 'user',
            content: 'hi',
            timestamp: '2026-05-25T10:00:00.000Z',
            action_type: 'user-message',
          },
        ],
        total_entries: 1,
      }),
    } as Response)

    await expect(fetchTranscriptOnTokenServer('s')).resolves.toEqual({
      transcript: [
        {
          role: 'user',
          content: 'hi',
          timestamp: '2026-05-25T10:00:00.000Z',
          action_type: 'user-message',
        },
      ],
      total_entries: 1,
    })
  })

  it('returns empty transcript when payload is malformed', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)
    await expect(fetchTranscriptOnTokenServer('s')).resolves.toEqual({
      transcript: [],
      total_entries: undefined,
    })
  })
})
