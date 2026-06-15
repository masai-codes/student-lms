import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CHATBOT_AGENT_NAME } from '@/server/api/chatbot/constants'
import { createChatbotToken } from '@/server/api/chatbot/token.service'

const mockAddGrant = vi.fn()
const mockToJwt = vi.fn()
let capturedRoomConfig: unknown

vi.mock('livekit-server-sdk', () => ({
  AccessToken: vi.fn().mockImplementation(() => ({
    addGrant: mockAddGrant,
    toJwt: mockToJwt,
    get roomConfig() {
      return capturedRoomConfig
    },
    set roomConfig(value: unknown) {
      capturedRoomConfig = value
    },
  })),
}))

const ORIGINAL_ENV = {
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  LIVEKIT_URL: process.env.LIVEKIT_URL,
}

beforeEach(() => {
  process.env.LIVEKIT_API_KEY = 'key'
  process.env.LIVEKIT_API_SECRET = 'secret'
  process.env.LIVEKIT_URL = 'wss://livekit.test'
  mockAddGrant.mockReset()
  mockToJwt.mockReset()
  mockToJwt.mockResolvedValue('jwt-token')
  capturedRoomConfig = undefined
})

afterEach(() => {
  if (ORIGINAL_ENV.LIVEKIT_API_KEY === undefined) delete process.env.LIVEKIT_API_KEY
  else process.env.LIVEKIT_API_KEY = ORIGINAL_ENV.LIVEKIT_API_KEY
  if (ORIGINAL_ENV.LIVEKIT_API_SECRET === undefined) delete process.env.LIVEKIT_API_SECRET
  else process.env.LIVEKIT_API_SECRET = ORIGINAL_ENV.LIVEKIT_API_SECRET
  if (ORIGINAL_ENV.LIVEKIT_URL === undefined) delete process.env.LIVEKIT_URL
  else process.env.LIVEKIT_URL = ORIGINAL_ENV.LIVEKIT_URL
})

describe('createChatbotToken', () => {
  it('includes lecture context in agent metadata', async () => {
    const result = await createChatbotToken({
      mode: 'text',
      sessionId: 'session-1',
      lectureId: 42,
      lectureTranscript: 'Intro to React hooks',
    })

    expect(result).toMatchObject({
      serverUrl: 'wss://livekit.test',
      participantToken: 'jwt-token',
      sessionId: 'session-1',
    })
    expect(mockAddGrant).toHaveBeenCalledWith(
      expect.objectContaining({ roomJoin: true, canPublish: true }),
    )

    const roomConfig = capturedRoomConfig as {
      agents: Array<{ agentName: string; metadata: string }>
    }
    expect(roomConfig.agents[0].agentName).toBe(CHATBOT_AGENT_NAME)
    expect(JSON.parse(roomConfig.agents[0].metadata)).toEqual({
      mode: 'text',
      participant_identity: expect.any(String),
      session_id: 'session-1',
      lecture_id: '42',
      lecture_transcript: 'Intro to React hooks',
    })
  })

  it('throws when LiveKit env vars are missing', async () => {
    delete process.env.LIVEKIT_API_KEY

    await expect(
      createChatbotToken({
        mode: 'voice',
        sessionId: 'session-1',
        lectureId: 1,
        lectureTranscript: 'transcript',
      }),
    ).rejects.toThrow('CHATBOT_LIVEKIT_API_KEY_NOT_CONFIGURED')
  })
})
