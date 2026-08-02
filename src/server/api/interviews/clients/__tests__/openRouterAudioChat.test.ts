import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requestInterviewAudioChatTurn } from '../openRouterAudioChat'

describe('requestInterviewAudioChatTurn', () => {
  const originalKey = process.env.OPENROUTER_API_KEY

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY
    else process.env.OPENROUTER_API_KEY = originalKey
  })

  function mockOpenRouter(content: string | null, ok = true) {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok,
      json: () => Promise.resolve({ choices: [{ message: { content } }] }),
    } as Response)
  }

  const baseInput = {
    messages: [{ role: 'system' as const, content: 's' }],
    model: 'test/model',
  }

  it('returns the parsed transcript and nextQuestion on success', async () => {
    mockOpenRouter(
      JSON.stringify({ transcript: 'hello there', nextQuestion: 'and then?' }),
    )
    await expect(requestInterviewAudioChatTurn(baseInput)).resolves.toEqual({
      transcript: 'hello there',
      nextQuestion: 'and then?',
    })
  })

  it('accepts a null nextQuestion (end of interview)', async () => {
    mockOpenRouter(
      JSON.stringify({ transcript: 'final answer', nextQuestion: null }),
    )
    await expect(requestInterviewAudioChatTurn(baseInput)).resolves.toEqual({
      transcript: 'final answer',
      nextQuestion: null,
    })
  })

  it('sends the model, messages, and Bearer auth header', async () => {
    mockOpenRouter(JSON.stringify({ transcript: 'a', nextQuestion: null }))
    await requestInterviewAudioChatTurn(baseInput)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toBe('https://openrouter.ai/api/v1/chat/completions')
    const init = call[1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-key',
    )
    const body = JSON.parse(String(init.body)) as { model: string }
    expect(body.model).toBe('test/model')
  })

  it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED without an API key', async () => {
    delete process.env.OPENROUTER_API_KEY
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_NOT_CONFIGURED',
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('throws INTERVIEW_OPENROUTER_REQUEST_FAILED for non-2xx responses', async () => {
    mockOpenRouter(null, false)
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_REQUEST_FAILED',
    )
  })

  it('throws INTERVIEW_OPENROUTER_EMPTY_RESPONSE when content is empty', async () => {
    mockOpenRouter('   ')
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_EMPTY_RESPONSE',
    )
  })

  it('throws INTERVIEW_OPENROUTER_INVALID_RESPONSE for non-JSON content', async () => {
    mockOpenRouter('not json at all')
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_INVALID_RESPONSE',
    )
  })

  it('throws INTERVIEW_OPENROUTER_INVALID_RESPONSE when the schema does not match', async () => {
    mockOpenRouter(JSON.stringify({ transcript: 123, nextQuestion: null }))
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_INVALID_RESPONSE',
    )
  })

  it('wraps generic fetch failures as INTERVIEW_OPENROUTER_REQUEST_FAILED', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_REQUEST_FAILED',
    )
  })

  it('throws INTERVIEW_OPENROUTER_TIMEOUT on AbortError', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    })
    await expect(requestInterviewAudioChatTurn(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_TIMEOUT',
    )
  })
})
