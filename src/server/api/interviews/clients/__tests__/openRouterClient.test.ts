import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestOpenRouterChatCompletionStream } from '../openRouterClient'

function sseBodyFromFrames(frames: Array<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(`data: ${frame}\n\n`))
      }
      controller.close()
    },
  })
}

function chunkFrame(content: string): string {
  return JSON.stringify({ choices: [{ delta: { content } }] })
}

describe('requestOpenRouterChatCompletionStream', () => {
  const originalKey = process.env.OPENROUTER_API_KEY
  const baseInput = {
    messages: [{ role: 'system' as const, content: 's' }],
    model: 'test/model',
  }

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY
    else process.env.OPENROUTER_API_KEY = originalKey
  })

  async function collect(gen: AsyncGenerator<string>): Promise<Array<string>> {
    const out: Array<string> = []
    for await (const chunk of gen) out.push(chunk)
    return out
  }

  it('yields content deltas in order and skips [DONE] / keep-alive lines', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([
        chunkFrame('{"nextQuestion": "Hi'),
        chunkFrame(' there"}'),
        '[DONE]',
      ]),
    } as Response)

    const chunks = await collect(
      requestOpenRouterChatCompletionStream(baseInput),
    )
    expect(chunks).toEqual(['{"nextQuestion": "Hi', ' there"}'])
  })

  it('sends stream:true and the response_format when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([chunkFrame('x')]),
    } as Response)

    const format = {
      type: 'json_schema' as const,
      json_schema: {
        name: 'x',
        strict: true as const,
        schema: { type: 'object' },
      },
    }
    await collect(
      requestOpenRouterChatCompletionStream({
        ...baseInput,
        responseFormat: format,
      }),
    )

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String((call[1] as RequestInit).body)) as {
      stream?: boolean
      response_format?: unknown
    }
    expect(body.stream).toBe(true)
    expect(body.response_format).toEqual(format)
  })

  it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED without an API key', async () => {
    delete process.env.OPENROUTER_API_KEY
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('throws INTERVIEW_OPENROUTER_REQUEST_FAILED for non-2xx responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      body: null,
    } as Response)
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_REQUEST_FAILED')
  })

  it('throws INTERVIEW_OPENROUTER_EMPTY_RESPONSE when no content deltas arrive', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames(['[DONE]']),
    } as Response)
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
  })

  it('wraps generic fetch failures as INTERVIEW_OPENROUTER_REQUEST_FAILED', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_REQUEST_FAILED')
  })

  it('throws INTERVIEW_OPENROUTER_TIMEOUT on AbortError', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    })
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_TIMEOUT')
  })
})
