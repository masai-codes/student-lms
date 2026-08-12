import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ submitInterviewTurnStream: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/submitInterviewTurn.service', () => ({
  submitInterviewTurnStream: hoisted.submitInterviewTurnStream,
}))

function reqWithTypedAnswer(text: string) {
  const form = new FormData()
  form.append('typedAnswer', text)
  return new Request(
    'http://localhost/api/interviews/sessions/42/turns/stream',
    { method: 'POST', body: form },
  )
}

async function* fakeGenerator(
  events: Array<any>,
  finalError?: unknown,
): AsyncGenerator<any> {
  for (const event of events) yield event
  if (finalError) throw finalError
}

async function readSseEvents(res: Response): Promise<Array<any>> {
  const text = await res.text()
  return text
    .split('\n\n')
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice('data:'.length).trim()))
}

beforeEach(() => vi.clearAllMocks())

describe('handleStreamSubmitInterviewTurn', () => {
  it('returns 400 for an invalid session id (before any stream starts)', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleStreamSubmitInterviewTurn } =
      await import('../streamSubmitTurn.handler')

    const res = await handleStreamSubmitInterviewTurn(
      reqWithTypedAnswer('hi'),
      'abc',
    )
    expect(res.status).toBe(400)
    expect(res.headers.get('content-type')).not.toContain('text/event-stream')
  })

  it('returns a normal JSON error when the session lookup fails before the first yield', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.submitInterviewTurnStream.mockReturnValueOnce(
      fakeGenerator([], new ApiError(409, 'INTERVIEW_SESSION_NOT_IN_PROGRESS')),
    )
    const { handleStreamSubmitInterviewTurn } =
      await import('../streamSubmitTurn.handler')

    const res = await handleStreamSubmitInterviewTurn(
      reqWithTypedAnswer('hi'),
      '42',
    )
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_SESSION_NOT_IN_PROGRESS',
    })
  })

  it('streams audio-delta then done as SSE events', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitInterviewTurnStream.mockReturnValueOnce(
      fakeGenerator([
        { type: 'audio-delta', data: 'QUJD' },
        { type: 'audio-delta', data: 'REVG' },
        {
          type: 'done',
          result: {
            status: 'in_progress',
            nextQuestion: 'How do you handle it?',
          },
        },
      ]),
    )
    const { handleStreamSubmitInterviewTurn } =
      await import('../streamSubmitTurn.handler')

    const res = await handleStreamSubmitInterviewTurn(
      reqWithTypedAnswer('hi'),
      '42',
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const events = await readSseEvents(res)
    expect(events).toEqual([
      { type: 'audio-delta', data: 'QUJD' },
      { type: 'audio-delta', data: 'REVG' },
      {
        type: 'done',
        result: {
          status: 'in_progress',
          nextQuestion: 'How do you handle it?',
        },
      },
    ])
  })

  it('emits a terminal error event when a failure happens mid-stream (after deltas)', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.submitInterviewTurnStream.mockReturnValueOnce(
      fakeGenerator(
        [{ type: 'audio-delta', data: 'QUJD' }],
        new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY'),
      ),
    )
    const { handleStreamSubmitInterviewTurn } =
      await import('../streamSubmitTurn.handler')

    const res = await handleStreamSubmitInterviewTurn(
      reqWithTypedAnswer('hi'),
      '42',
    )
    expect(res.status).toBe(200) // headers already committed to the stream

    const events = await readSseEvents(res)
    expect(events).toEqual([
      { type: 'audio-delta', data: 'QUJD' },
      { type: 'error', code: 'INTERVIEW_RESPONSE_EMPTY' },
    ])
  })
})
