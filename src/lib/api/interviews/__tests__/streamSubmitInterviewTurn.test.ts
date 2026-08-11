import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamSubmitInterviewTurn } from '../streamSubmitInterviewTurn'

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
  status: 'done' | 'error'
  code?: string
  result?: unknown
  deltas: Array<string>
}

function runStream(response: Response): Promise<StreamResult> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
  const deltas: Array<string> = []

  return new Promise((resolve) => {
    streamSubmitInterviewTurn(
      42,
      { kind: 'typed', text: 'my answer' },
      {
        onAudioDelta: (data) => deltas.push(data),
        onQuestionText: () => {},
        onDone: (result) => resolve({ status: 'done', result, deltas }),
        onError: (code) => resolve({ status: 'error', code, deltas }),
      },
    )
  })
}

describe('streamSubmitInterviewTurn', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('dispatches audio-delta events then done with the result', async () => {
    const response = streamResponse([
      sse({ type: 'audio-delta', data: 'QUJD' }),
      sse(
        { type: 'audio-delta', data: 'REVG' },
        {
          type: 'done',
          result: {
            status: 'in_progress',
            nextQuestion: 'How do you handle collisions?',
          },
        },
      ),
    ])

    const result = await runStream(response)
    expect(result.status).toBe('done')
    expect(result.deltas).toEqual(['QUJD', 'REVG'])
    expect(result.result).toEqual({
      status: 'in_progress',
      nextQuestion: 'How do you handle collisions?',
    })
  })

  it('surfaces a terminal error event emitted mid-stream', async () => {
    const response = streamResponse([
      sse({ type: 'audio-delta', data: 'QUJD' }),
      sse({ type: 'error', code: 'INTERVIEW_RESPONSE_EMPTY' }),
    ])

    const result = await runStream(response)
    expect(result.status).toBe('error')
    expect(result.code).toBe('INTERVIEW_RESPONSE_EMPTY')
    expect(result.deltas).toEqual(['QUJD'])
  })

  it('surfaces the server error code on a non-SSE error response', async () => {
    const response = new Response(
      JSON.stringify({ code: 'INTERVIEW_SESSION_NOT_IN_PROGRESS' }),
      { status: 409, headers: { 'content-type': 'application/json' } },
    )

    const result = await runStream(response)
    expect(result.status).toBe('error')
    expect(result.code).toBe('INTERVIEW_SESSION_NOT_IN_PROGRESS')
  })

  it('sends the answer as multipart form data with same-origin credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      streamResponse([
        sse({
          type: 'done',
          result: { status: 'completed', report: {} },
        }),
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    await new Promise<void>((resolve) => {
      streamSubmitInterviewTurn(
        7,
        { kind: 'typed', text: 'hello' },
        {
          onAudioDelta: () => {},
          onQuestionText: () => {},
          onDone: () => resolve(),
          onError: () => resolve(),
        },
      )
    })

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe('/api/interviews/sessions/7/turns/stream')
    const init = call[1] as RequestInit
    expect(init.credentials).toBe('same-origin')
    const form = init.body as FormData
    expect(form.get('typedAnswer')).toBe('hello')
  })
})
