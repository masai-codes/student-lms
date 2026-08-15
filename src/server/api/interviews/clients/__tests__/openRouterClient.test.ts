import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
  getOpenRouterTextModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: hoisted.generateText,
  streamText: hoisted.streamText,
}))
vi.mock('@/server/api/interviews/clients/openRouterModel', () => ({
  getOpenRouterTextModel: hoisted.getOpenRouterTextModel,
}))

import {
  requestOpenRouterAudioStream,
  requestOpenRouterChatCompletion,
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

async function* toAsyncGenerator<T>(items: Array<T>): AsyncGenerator<T> {
  for (const item of items) yield item
}

function rejectingAsyncIterable(error: unknown): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]() {
      return { next: () => Promise.reject(error) }
    },
  }
}

const baseInput = {
  messages: [{ role: 'system' as const, content: 's' }],
  model: 'test/model',
}

describe('requestOpenRouterChatCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getOpenRouterTextModel.mockReturnValue('mock-model')
  })

  it('returns the trimmed assistant content on success', async () => {
    hoisted.generateText.mockResolvedValue({ text: '  Hello!  ' })
    await expect(requestOpenRouterChatCompletion(baseInput)).resolves.toBe(
      'Hello!',
    )
  })

  it('passes the model and messages through to generateText', async () => {
    hoisted.generateText.mockResolvedValue({ text: 'ok' })
    await requestOpenRouterChatCompletion(baseInput)

    expect(hoisted.getOpenRouterTextModel).toHaveBeenCalledWith('test/model')
    expect(hoisted.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        messages: baseInput.messages,
      }),
    )
  })

  it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED without an API key', async () => {
    hoisted.getOpenRouterTextModel.mockImplementation(() => {
      throw new Error('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    })
    await expect(requestOpenRouterChatCompletion(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_NOT_CONFIGURED',
    )
    expect(hoisted.generateText).not.toHaveBeenCalled()
  })

  it('throws INTERVIEW_OPENROUTER_EMPTY_RESPONSE when content is empty', async () => {
    hoisted.generateText.mockResolvedValue({ text: '   ' })
    await expect(requestOpenRouterChatCompletion(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_EMPTY_RESPONSE',
    )
  })

  it('wraps generic generateText failures as INTERVIEW_OPENROUTER_REQUEST_FAILED', async () => {
    hoisted.generateText.mockRejectedValue(new Error('network down'))
    await expect(requestOpenRouterChatCompletion(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_REQUEST_FAILED',
    )
  })

  it('throws INTERVIEW_OPENROUTER_TIMEOUT when the abort signal times out', async () => {
    hoisted.generateText.mockRejectedValue(
      new DOMException('timed out', 'TimeoutError'),
    )
    await expect(requestOpenRouterChatCompletion(baseInput)).rejects.toThrow(
      'INTERVIEW_OPENROUTER_TIMEOUT',
    )
  })
})

describe('requestOpenRouterChatCompletionStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getOpenRouterTextModel.mockReturnValue('mock-model')
  })

  async function collect(gen: AsyncGenerator<string>): Promise<Array<string>> {
    const out: Array<string> = []
    for await (const chunk of gen) out.push(chunk)
    return out
  }

  it('yields text deltas in order', async () => {
    hoisted.streamText.mockReturnValue({
      textStream: toAsyncGenerator(['Hi', ' there']),
    })

    const chunks = await collect(
      requestOpenRouterChatCompletionStream(baseInput),
    )
    expect(chunks).toEqual(['Hi', ' there'])
  })

  it('passes the model and messages through to streamText', async () => {
    hoisted.streamText.mockReturnValue({ textStream: toAsyncGenerator(['x']) })
    await collect(requestOpenRouterChatCompletionStream(baseInput))

    expect(hoisted.getOpenRouterTextModel).toHaveBeenCalledWith('test/model')
    expect(hoisted.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        messages: baseInput.messages,
      }),
    )
  })

  it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED without an API key', async () => {
    hoisted.getOpenRouterTextModel.mockImplementation(() => {
      throw new Error('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    })
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    expect(hoisted.streamText).not.toHaveBeenCalled()
  })

  it('throws INTERVIEW_OPENROUTER_EMPTY_RESPONSE when no deltas arrive', async () => {
    hoisted.streamText.mockReturnValue({ textStream: toAsyncGenerator([]) })
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
  })

  it('wraps generic stream failures as INTERVIEW_OPENROUTER_REQUEST_FAILED', async () => {
    hoisted.streamText.mockReturnValue({
      textStream: rejectingAsyncIterable(new Error('network down')),
    })
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_REQUEST_FAILED')
  })

  it('throws INTERVIEW_OPENROUTER_TIMEOUT when the abort signal times out', async () => {
    hoisted.streamText.mockReturnValue({
      textStream: rejectingAsyncIterable(
        new DOMException('timed out', 'TimeoutError'),
      ),
    })
    await expect(
      collect(requestOpenRouterChatCompletionStream(baseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_TIMEOUT')
  })
})

describe('requestOpenRouterAudioStream', () => {
  const originalKey = process.env.OPENROUTER_API_KEY
  const audioBaseInput = {
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

    const events = await collectEvents(
      requestOpenRouterAudioStream(audioBaseInput),
    )
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

    await collectEvents(requestOpenRouterAudioStream(audioBaseInput))

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
      collectEvents(requestOpenRouterAudioStream(audioBaseInput)),
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

    const events = await collectEvents(
      requestOpenRouterAudioStream(audioBaseInput),
    )
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
    await collectEvents(
      requestOpenRouterAudioStream({ ...audioBaseInput, tools }),
    )

    const call = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String((call[1] as RequestInit).body)) as {
      tools?: unknown
    }
    expect(body.tools).toEqual(tools)
  })

  it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED without an API key', async () => {
    delete process.env.OPENROUTER_API_KEY
    await expect(
      collectEvents(requestOpenRouterAudioStream(audioBaseInput)),
    ).rejects.toThrow('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
    expect(fetch).not.toHaveBeenCalled()
  })
})
