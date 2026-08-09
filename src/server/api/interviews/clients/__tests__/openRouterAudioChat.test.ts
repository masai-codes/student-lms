import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requestInterviewTurnAudioStream } from '../openRouterAudioChat'

describe('requestInterviewTurnAudioStream', () => {
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

  const baseInput = {
    messages: [{ role: 'system' as const, content: 's' }],
    model: 'test/model',
  }

  function sseBodyFromFrames(
    frames: Array<string>,
  ): ReadableStream<Uint8Array> {
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

  function audioFrame(data: string) {
    return JSON.stringify({ choices: [{ delta: { audio: { data } } }] })
  }
  function transcriptFrame(transcript: string) {
    return JSON.stringify({ choices: [{ delta: { audio: { transcript } } }] })
  }

  async function collect(
    gen: AsyncGenerator<{ type: string; data?: string; spokenText?: string }>,
  ) {
    const events: Array<{ type: string; data?: string; spokenText?: string }> =
      []
    for await (const event of gen) events.push(event)
    return events
  }

  it('yields audio chunks as they arrive, then a final spokenText from the transcript deltas', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([
        transcriptFrame('How do you '),
        audioFrame('QUJD'),
        transcriptFrame('handle collisions?'),
        audioFrame('REVG'),
        '[DONE]',
      ]),
    } as Response)

    const events = await collect(requestInterviewTurnAudioStream(baseInput))
    expect(events).toEqual([
      { type: 'audio', data: 'QUJD' },
      { type: 'audio', data: 'REVG' },
      { type: 'final', spokenText: 'How do you handle collisions?' },
    ])
  })

  it('yields an empty spokenText when only audio (no transcript) arrives', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([audioFrame('QUJD'), '[DONE]']),
    } as Response)

    const events = await collect(requestInterviewTurnAudioStream(baseInput))
    expect(events).toEqual([
      { type: 'audio', data: 'QUJD' },
      { type: 'final', spokenText: '' },
    ])
  })

  it('sends the model, messages, and Bearer auth header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([audioFrame('QUJD')]),
    } as Response)

    await collect(requestInterviewTurnAudioStream(baseInput))

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
    await expect(
      collect(requestInterviewTurnAudioStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('throws INTERVIEW_OPENROUTER_REQUEST_FAILED for non-2xx responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      body: null,
    } as Response)
    await expect(
      collect(requestInterviewTurnAudioStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_REQUEST_FAILED')
  })

  it('throws INTERVIEW_OPENROUTER_EMPTY_RESPONSE when no deltas arrive', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames(['[DONE]']),
    } as Response)
    await expect(
      collect(requestInterviewTurnAudioStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
  })

  it('wraps generic fetch failures as INTERVIEW_OPENROUTER_REQUEST_FAILED', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await expect(
      collect(requestInterviewTurnAudioStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_REQUEST_FAILED')
  })

  it('throws INTERVIEW_OPENROUTER_TIMEOUT on AbortError', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    })
    await expect(
      collect(requestInterviewTurnAudioStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_TIMEOUT')
  })

  function toolCallFrame(name: string) {
    return JSON.stringify({
      choices: [{ delta: { tool_calls: [{ function: { name } }] } }],
    })
  }

  it('yields a tool_call event and stops, without a final spokenText, when the model calls a tool', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: sseBodyFromFrames([
        toolCallFrame('move_to_next_question'),
        '[DONE]',
      ]),
    } as Response)

    const events = await collect(
      requestInterviewTurnAudioStream({
        ...baseInput,
        tools: [
          {
            type: 'function',
            function: {
              name: 'move_to_next_question',
              description: 'move on',
              parameters: { type: 'object', properties: {} },
            },
          },
        ],
      }),
    )
    expect(events).toEqual([
      { type: 'tool_call', name: 'move_to_next_question' },
    ])
  })
})
