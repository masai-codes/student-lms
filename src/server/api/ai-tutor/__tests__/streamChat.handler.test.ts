import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH } from '@/server/api/ai-tutor/constants'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  ensureAnthropicConfigured: vi.fn(),
  prepareLectureChatContext: vi.fn(),
  streamLectureChatEventsFromContext: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/clients/anthropicModel', () => ({
  ensureAnthropicConfigured: hoisted.ensureAnthropicConfigured,
}))

vi.mock('@/server/api/ai-tutor/streamAiTutorChat.service', () => ({
  prepareLectureChatContext: hoisted.prepareLectureChatContext,
  streamLectureChatEventsFromContext:
    hoisted.streamLectureChatEventsFromContext,
}))

function postRequest(
  body: unknown,
  cookie: string | null = 'session=abc',
): Request {
  return new Request('http://localhost/api/ai-tutor/chat/stream', {
    method: 'POST',
    headers: {
      ...(cookie ? { cookie } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function readSseBody(response: Response): Promise<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let output = ''
  let result = await reader.read()

  while (!result.done) {
    output += decoder.decode(result.value)
    result = await reader.read()
  }

  return output
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSessionUserId).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleStreamChat', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const res = await handleStreamChat(
      postRequest(
        { lectureId: 1, chat: 'hello', platform: 'web-desktop' },
        null,
      ),
    )

    expect(res.status).toBe(401)
  })

  it('returns 400 when lectureId is invalid', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({ lectureId: 0, chat: 'hi', platform: 'web-desktop' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
      message: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
  })

  it('returns 400 when chat is empty', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({ lectureId: 1, chat: '   ', platform: 'web-desktop' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_CHAT_MESSAGE_EMPTY',
      message: 'AI_TUTOR_CHAT_MESSAGE_EMPTY',
    })
  })

  it('returns 400 when chat exceeds the max length', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({
        lectureId: 1,
        chat: 'a'.repeat(AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH + 1),
        platform: 'web-desktop',
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_CHAT_MESSAGE_TOO_LONG',
      message: 'AI_TUTOR_CHAT_MESSAGE_TOO_LONG',
    })
  })

  it('returns 400 when language is invalid', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({
        lectureId: 1,
        chat: 'hello',
        platform: 'web-desktop',
        language: 'spanish',
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_LANGUAGE_INVALID',
      message: 'AI_TUTOR_LANGUAGE_INVALID',
    })
    expect(hoisted.prepareLectureChatContext).not.toHaveBeenCalled()
  })

  it('returns 400 when platform is invalid', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({ lectureId: 1, chat: 'hello', platform: 'windows' }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_PLATFORM_INVALID',
      message: 'AI_TUTOR_PLATFORM_INVALID',
    })
    expect(hoisted.prepareLectureChatContext).not.toHaveBeenCalled()
  })

  it('returns 400 when supportedUIElements is not an array', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({
        lectureId: 1,
        chat: 'hello',
        platform: 'web-desktop',
        supportedUIElements: 'quiz',
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
      message: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
    })
    expect(hoisted.prepareLectureChatContext).not.toHaveBeenCalled()
  })

  it('returns 400 when supportedUIElements contains an unrecognized element', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)

    const res = await handleStreamChat(
      postRequest({
        lectureId: 1,
        chat: 'hello',
        platform: 'web-desktop',
        supportedUIElements: ['flashcards'],
      }),
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
      message: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
    })
    expect(hoisted.prepareLectureChatContext).not.toHaveBeenCalled()
  })

  it('returns 503 when Anthropic is not configured', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.ensureAnthropicConfigured.mockImplementationOnce(() => {
      throw new ApiError(503, 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')
    })

    const res = await handleStreamChat(
      postRequest({
        lectureId: 1,
        chat: 'explain hooks',
        platform: 'web-desktop',
      }),
    )

    expect(res.status).toBe(503)
  })

  it('returns 404 when the chat id does not exist for the user and lecture', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.prepareLectureChatContext.mockRejectedValueOnce(
      new ApiError(404, 'AI_TUTOR_CHAT_NOT_FOUND'),
    )

    const res = await handleStreamChat(
      postRequest({
        lectureId: 99,
        chat: 'hello',
        platform: 'web-desktop',
        chatID: 2,
      }),
    )

    expect(res.status).toBe(422)
    expect(res.headers.get('x-true-status')).toBe('404')
    await expect(res.json()).resolves.toEqual({
      code: 'AI_TUTOR_CHAT_NOT_FOUND',
      message: 'AI_TUTOR_CHAT_NOT_FOUND',
    })
    expect(hoisted.streamLectureChatEventsFromContext).not.toHaveBeenCalled()
  })

  it('defaults language to English when omitted from the request', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.prepareLectureChatContext.mockResolvedValueOnce({
      chatRow: { id: 12, chatHistory: [] },
      systemPrompt: 'system prompt',
      messages: [{ role: 'user', content: 'explain hooks' }],
      chat: 'explain hooks',
      platform: 'app',
      language: 'English',
    })
    hoisted.streamLectureChatEventsFromContext.mockImplementationOnce(
      function* () {
        yield { type: 'done' as const, chatId: 12 }
      },
    )

    await handleStreamChat(
      postRequest({ lectureId: 99, chat: 'explain hooks' }),
    )

    expect(hoisted.prepareLectureChatContext).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 99,
      chat: 'explain hooks',
      chatId: undefined,
      platform: 'app',
      language: 'English',
      supportedUIElements: [],
    })
  })

  it('streams token events over SSE for an authenticated request', async () => {
    const { handleStreamChat } = await import('../handlers/streamChat.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.prepareLectureChatContext.mockResolvedValueOnce({
      chatRow: { id: 12, chatHistory: [] },
      systemPrompt: 'system prompt',
      messages: [{ role: 'user', content: 'explain hooks' }],
      chat: 'explain hooks',
      platform: 'web-mobile',
      language: 'Hindi',
    })

    function* events() {
      yield { type: 'token' as const, content: 'Hello ' }
      yield { type: 'done' as const, chatId: 12 }
    }

    hoisted.streamLectureChatEventsFromContext.mockImplementationOnce(() =>
      events(),
    )

    const res = await handleStreamChat(
      postRequest({
        lectureId: 99,
        chat: 'explain hooks',
        chatID: 12,
        platform: 'web-mobile',
        language: 'hi',
        supportedUIElements: ['quiz'],
      }),
    )

    expect(hoisted.prepareLectureChatContext).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 99,
      chat: 'explain hooks',
      chatId: 12,
      platform: 'web-mobile',
      language: 'Hindi',
      supportedUIElements: ['quiz'],
    })
    expect(hoisted.streamLectureChatEventsFromContext).toHaveBeenCalledWith({
      chatRow: { id: 12, chatHistory: [] },
      systemPrompt: 'system prompt',
      messages: [{ role: 'user', content: 'explain hooks' }],
      chat: 'explain hooks',
      platform: 'web-mobile',
      language: 'Hindi',
    })
    expect(res.status).toBe(200)

    const body = await readSseBody(res)
    expect(body).toContain('data: {"type":"token","content":"Hello "}')
    expect(body.endsWith('data: {"type":"done","chatId":12}\n\n')).toBe(true)
  })
})
