import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  requestOpenRouterAudioStream,
  requestOpenRouterChatCompletionStream,
} from '../openRouterClient'

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

  it('sends stream:true', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([chunkFrame('x')]),
    } as Response)

    await collect(requestOpenRouterChatCompletionStream(baseInput))

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String((call[1] as RequestInit).body)) as {
      stream?: boolean
    }
    expect(body.stream).toBe(true)
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

describe('requestOpenRouterAudioStream', () => {
  const originalKey = process.env.OPENROUTER_API_KEY
  const baseInput = {
    messages: [{ role: 'system' as const, content: 's' }],
    model: 'test/model',
    voice: 'alloy',
    format: 'pcm16' as const,
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

  function audioFrame(data: string) {
    return JSON.stringify({ choices: [{ delta: { audio: { data } } }] })
  }
  function transcriptFrame(transcript: string) {
    return JSON.stringify({ choices: [{ delta: { audio: { transcript } } }] })
  }

  async function collectEvents(
    gen: AsyncGenerator<{ type: string; data?: string; text?: string }>,
  ) {
    const events: Array<{ type: string; data?: string; text?: string }> = []
    for await (const event of gen) events.push(event)
    return events
  }

  it('yields audio and transcript deltas in order', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([
        transcriptFrame('Hi'),
        audioFrame('QUJD'),
        audioFrame('REVG'),
        '[DONE]',
      ]),
    } as Response)

    const events = await collectEvents(requestOpenRouterAudioStream(baseInput))
    expect(events).toEqual([
      { type: 'transcript', text: 'Hi' },
      { type: 'audio', data: 'QUJD' },
      { type: 'audio', data: 'REVG' },
    ])
  })

  it('sends modalities, audio config, and stream:true', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([audioFrame('QUJD')]),
    } as Response)

    await collectEvents(requestOpenRouterAudioStream(baseInput))

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String((call[1] as RequestInit).body)) as {
      stream?: boolean
      modalities?: Array<string>
      audio?: { voice: string; format: string }
    }
    expect(body.stream).toBe(true)
    expect(body.modalities).toEqual(['text', 'audio'])
    expect(body.audio).toEqual({ voice: 'alloy', format: 'pcm16' })
  })

  it('throws INTERVIEW_OPENROUTER_EMPTY_RESPONSE when no audio/transcript deltas arrive', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames(['[DONE]']),
    } as Response)
    await expect(
      collectEvents(requestOpenRouterAudioStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
  })

  function toolCallFrame(name: string) {
    return JSON.stringify({
      choices: [{ delta: { tool_calls: [{ function: { name } }] } }],
    })
  }

  it('yields a tool_call event when the model calls a tool', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([toolCallFrame('move_to_next_question')]),
    } as Response)

    const events = await collectEvents(requestOpenRouterAudioStream(baseInput))
    expect(events).toEqual([
      { type: 'tool_call', name: 'move_to_next_question' },
    ])
  })

  it('passes tools through in the request body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([toolCallFrame('move_to_next_question')]),
    } as Response)

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'move_to_next_question',
          description: 'move on',
          parameters: { type: 'object', properties: {} },
        },
      },
    ]
    await collectEvents(requestOpenRouterAudioStream({ ...baseInput, tools }))

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String((call[1] as RequestInit).body)) as {
      tools?: unknown
    }
    expect(body.tools).toEqual(tools)
  })
})
