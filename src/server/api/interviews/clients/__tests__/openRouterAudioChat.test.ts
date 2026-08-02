import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  requestInterviewAudioChatTurn,
  requestInterviewAudioChatTurnStream,
} from '../openRouterAudioChat'

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

  describe('requestInterviewAudioChatTurnStream', () => {
    function mockOpenRouterStream(contentChunks: Array<string>) {
      const encoder = new TextEncoder()
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const content of contentChunks) {
            const frame = JSON.stringify({ choices: [{ delta: { content } }] })
            controller.enqueue(encoder.encode(`data: ${frame}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, body } as Response)
    }

    async function collect(
      gen: AsyncGenerator<{ type: string; text?: string; result?: unknown }>,
    ) {
      const events: Array<{ type: string; text?: string; result?: unknown }> =
        []
      for await (const event of gen) events.push(event)
      return events
    }

    it('streams nextQuestion deltas then a final validated result', async () => {
      mockOpenRouterStream([
        '{"nextQuestion": "Hi! Could you explain the difference between',
        ' an array and a linked list?", "transcript": "the answer"}',
      ])

      const events = await collect(
        requestInterviewAudioChatTurnStream(baseInput),
      )
      const deltas = events
        .filter((e) => e.type === 'delta')
        .map((e) => e.text)
        .join('')
      expect(deltas).toBe(
        'Hi! Could you explain the difference between an array and a linked list?',
      )
      expect(events.at(-1)).toEqual({
        type: 'result',
        result: {
          nextQuestion:
            'Hi! Could you explain the difference between an array and a linked list?',
          transcript: 'the answer',
        },
      })
    })

    it('yields no deltas and a null nextQuestion on the final turn', async () => {
      mockOpenRouterStream([
        '{"nextQuestion": null, "transcript": "final answer"}',
      ])

      const events = await collect(
        requestInterviewAudioChatTurnStream(baseInput),
      )
      expect(events.filter((e) => e.type === 'delta')).toHaveLength(0)
      expect(events.at(-1)).toEqual({
        type: 'result',
        result: { nextQuestion: null, transcript: 'final answer' },
      })
    })

    it('throws INTERVIEW_OPENROUTER_INVALID_RESPONSE for a malformed final document', async () => {
      mockOpenRouterStream(['not json at all'])
      await expect(
        collect(requestInterviewAudioChatTurnStream(baseInput)),
      ).rejects.toThrow('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
    })
  })
})
