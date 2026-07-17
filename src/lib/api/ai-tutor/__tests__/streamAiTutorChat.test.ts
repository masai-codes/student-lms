import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSseFrameBuffer, streamLectureAiChat } from '../streamAiTutorChat'
import type { StreamLectureAiChatRequest } from '../streamAiTutorChat'

/** Encode events into `data: …\n\n` SSE frames (one frame per event). */
function sse(...events: Array<Record<string, unknown>>): string {
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')
}

function streamResponse(chunks: Array<string>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream; charset=utf-8' },
  })
}

type StreamResult = {
  status: 'complete' | 'error'
  chatId?: number | null
  code?: string
  tokens: Array<string>
  firstChunks: number
}

function runStream(
  request: StreamLectureAiChatRequest,
  response: Response,
): Promise<StreamResult> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
  const tokens: Array<string> = []
  let firstChunks = 0

  return new Promise((resolve) => {
    streamLectureAiChat(request, {
      onFirstChunk: () => {
        firstChunks += 1
      },
      onChunk: (token) => tokens.push(token),
      onComplete: (chatId) =>
        resolve({ status: 'complete', chatId, tokens, firstChunks }),
      onError: (code) =>
        resolve({ status: 'error', code, tokens, firstChunks }),
    })
  })
}

describe('createSseFrameBuffer', () => {
  it('reassembles a single frame split across chunks', () => {
    const buffer = createSseFrameBuffer()
    expect(buffer.push('data: {"type":"to')).toEqual([])
    expect(buffer.push('ken","content":"hi"}\n\n')).toEqual([
      '{"type":"token","content":"hi"}',
    ])
  })

  it('returns multiple complete frames from one chunk', () => {
    const buffer = createSseFrameBuffer()
    expect(buffer.push('data: {"a":1}\n\ndata: {"b":2}\n\n')).toEqual([
      '{"a":1}',
      '{"b":2}',
    ])
  })

  it('holds back a trailing frame until its terminator arrives', () => {
    const buffer = createSseFrameBuffer()
    expect(buffer.push('data: {"x":1}')).toEqual([])
    expect(buffer.push('\n\n')).toEqual(['{"x":1}'])
  })
})

describe('streamLectureAiChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('dispatches tokens then completes with the chatId', async () => {
    const response = streamResponse([
      sse({ type: 'token', content: 'Hel' }),
      sse({ type: 'token', content: 'lo' }, { type: 'done', chatId: 12 }),
    ])

    const result = await runStream(
      { lectureId: 1, chat: 'hi', platform: 'web-desktop' },
      response,
    )

    expect(result.status).toBe('complete')
    expect(result.chatId).toBe(12)
    expect(result.firstChunks).toBe(1)
    expect(result.tokens).toEqual(['Hel', 'lo'])
  })

  it('surfaces the server error code on a non-SSE error response', async () => {
    const response = new Response(
      JSON.stringify({
        code: 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED',
        message: 'nope',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )

    const result = await runStream(
      { lectureId: 1, chat: 'hi', platform: 'web-desktop' },
      response,
    )

    expect(result.status).toBe('error')
    expect(result.code).toBe('AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')
  })

  it('includes chatId in the request body only when provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(streamResponse([sse({ type: 'done', chatId: 5 })]))
    vi.stubGlobal('fetch', fetchMock)

    await new Promise<void>((resolve) => {
      streamLectureAiChat(
        { lectureId: 2, chat: 'q', platform: 'web-mobile', chatId: 9 },
        {
          onChunk: () => {},
          onComplete: () => resolve(),
          onError: () => resolve(),
        },
      )
    })

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(requestInit.body as string)).toEqual({
      lectureId: 2,
      chat: 'q',
      platform: 'web-mobile',
      chatId: 9,
    })
    expect(requestInit.credentials).toBe('same-origin')
  })
})
