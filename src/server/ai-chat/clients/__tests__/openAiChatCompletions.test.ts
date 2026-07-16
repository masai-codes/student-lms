import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requestOpenAiChatCompletion } from '../openAiChatCompletions'

describe('requestOpenAiChatCompletion', () => {
  const originalKey = process.env.OPENAI_API_KEY

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalKey
  })

  function mockOpenAi(content: string | null, ok = true) {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok,
      json: () => Promise.resolve({ choices: [{ message: { content } }] }),
    } as Response)
  }

  const baseInput = {
    messages: [
      { role: 'system' as const, content: 's' },
      { role: 'user' as const, content: 'hi' },
    ],
  }

  it('returns the trimmed assistant content on success', async () => {
    mockOpenAi('  Hello!  ')
    await expect(requestOpenAiChatCompletion(baseInput)).resolves.toBe('Hello!')
  })

  it('uses gpt-4.1-mini by default with Authorization header', async () => {
    mockOpenAi('ok')
    await requestOpenAiChatCompletion(baseInput)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toBe('https://api.openai.com/v1/chat/completions')
    const init = call[1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-key',
    )
    const body = JSON.parse(String(init.body)) as { model: string }
    expect(body.model).toBe('gpt-4.1-mini')
  })

  it('throws AI_CHAT_OPENAI_NOT_CONFIGURED without an API key', async () => {
    delete process.env.OPENAI_API_KEY
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_NOT_CONFIGURED',
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('throws AI_CHAT_OPENAI_REQUEST_FAILED for non-2xx responses', async () => {
    mockOpenAi(null, false)
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_REQUEST_FAILED',
    )
  })

  it('throws AI_CHAT_OPENAI_EMPTY_RESPONSE when content is empty', async () => {
    mockOpenAi('   ')
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_EMPTY_RESPONSE',
    )
  })

  it('wraps generic fetch failures as AI_CHAT_OPENAI_REQUEST_FAILED', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_REQUEST_FAILED',
    )
  })

  it('throws AI_CHAT_OPENAI_TIMEOUT on AbortError', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    })
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_TIMEOUT',
    )
  })
})
