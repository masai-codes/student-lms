import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ createInterviewSessionStream: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/interviewSession.service', () => ({
  createInterviewSessionStream: hoisted.createInterviewSessionStream,
}))

function req(body: unknown) {
  return new Request('http://localhost/api/interviews/sessions/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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

describe('handleStreamCreateInterviewSession', () => {
  it('returns 400 when topicId is missing (before any stream starts)', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleStreamCreateInterviewSession } =
      await import('../streamCreateSession.handler')

    const res = await handleStreamCreateInterviewSession(req({}))
    expect(res.status).toBe(400)
    expect(res.headers.get('content-type')).not.toContain('text/event-stream')
  })

  it('returns a normal JSON error when the daily limit check fails before the first yield', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.createInterviewSessionStream.mockReturnValueOnce(
      fakeGenerator([], new ApiError(429, 'INTERVIEW_DAILY_LIMIT')),
    )
    const { handleStreamCreateInterviewSession } =
      await import('../streamCreateSession.handler')

    const res = await handleStreamCreateInterviewSession(
      req({ topicId: 'dsa' }),
    )
    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_DAILY_LIMIT',
    })
  })

  it('streams audio-delta then done as SSE events', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.createInterviewSessionStream.mockReturnValueOnce(
      fakeGenerator([
        { type: 'audio-delta', data: 'QUJD' },
        { type: 'audio-delta', data: 'REVG' },
        {
          type: 'done',
          result: { sessionId: 42, question: 'Hi, welcome! Tell me...' },
        },
      ]),
    )
    const { handleStreamCreateInterviewSession } =
      await import('../streamCreateSession.handler')

    const res = await handleStreamCreateInterviewSession(
      req({ topicId: 'dsa' }),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const events = await readSseEvents(res)
    expect(events).toEqual([
      { type: 'audio-delta', data: 'QUJD' },
      { type: 'audio-delta', data: 'REVG' },
      {
        type: 'done',
        result: { sessionId: 42, question: 'Hi, welcome! Tell me...' },
      },
    ])
  })

  it('emits a terminal error event when a failure happens mid-stream (after deltas)', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.createInterviewSessionStream.mockReturnValueOnce(
      fakeGenerator([{ type: 'audio-delta', data: 'QUJD' }], new Error('boom')),
    )
    const { handleStreamCreateInterviewSession } =
      await import('../streamCreateSession.handler')

    const res = await handleStreamCreateInterviewSession(
      req({ topicId: 'dsa' }),
    )
    expect(res.status).toBe(200) // headers already committed to the stream

    const events = await readSseEvents(res)
    expect(events).toEqual([
      { type: 'audio-delta', data: 'QUJD' },
      { type: 'error', code: 'SERVER_ERROR_CREATING_INTERVIEW_SESSION' },
    ])
  })
})
