import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleSendAiChatMessage } from '../sendMessage.handler'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { sendAiChatMessage } from '@/server/ai-chat/services/sendAiChatMessage'

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/ai-chat/services/sendAiChatMessage', () => ({
  AI_CHAT_MAX_MESSAGE_LENGTH: 4_000,
  sendAiChatMessage: vi.fn(),
}))

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/learn/ai-chat/5/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.mocked(requireSessionUserId).mockReset()
  vi.mocked(sendAiChatMessage).mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('handleSendAiChatMessage', () => {
  it('returns 200 with the send result on success', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(sendAiChatMessage).mockResolvedValueOnce({
      userMessage: {
        id: 'db-1',
        role: 'user',
        content: 'hi',
        source: 'text',
        timestamp: 1,
      },
      assistantMessage: {
        id: 'db-2',
        role: 'assistant',
        content: 'hello',
        source: 'text',
        timestamp: 2,
      },
    })

    const res = await handleSendAiChatMessage(
      makeRequest({ message: 'hi' }),
      '5',
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      userMessage: { content: string }
      assistantMessage: { content: string }
    }
    expect(body.userMessage.content).toBe('hi')
    expect(body.assistantMessage.content).toBe('hello')
    expect(sendAiChatMessage).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 5,
      message: 'hi',
    })
  })

  it('returns 401 when the user is not authenticated', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleSendAiChatMessage(
      makeRequest({ message: 'hi' }),
      '5',
    )
    expect(res.status).toBe(401)
    expect(sendAiChatMessage).not.toHaveBeenCalled()
  })

  it('returns 400 for a malformed body', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSendAiChatMessage(makeRequest({}), '5')
    expect(res.status).toBe(400)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('INVALID_AI_CHAT_PAYLOAD')
    expect(sendAiChatMessage).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid lecture id', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleSendAiChatMessage(
      makeRequest({ message: 'hi' }),
      '0',
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('INVALID_LECTURE_ID')
  })

  it('maps service errors to the correct status code', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    vi.mocked(sendAiChatMessage).mockRejectedValueOnce(
      new Error('AI_CHAT_OPENAI_NOT_CONFIGURED'),
    )

    const res = await handleSendAiChatMessage(
      makeRequest({ message: 'hi' }),
      '5',
    )
    expect(res.status).toBe(503)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('AI_CHAT_OPENAI_NOT_CONFIGURED')
  })
})
