import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({ submitInterviewTurn: vi.fn() }))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/interviews/services/submitInterviewTurn.service', () => ({
  submitInterviewTurn: hoisted.submitInterviewTurn,
}))

function reqWithTypedAnswer(text: string) {
  const form = new FormData()
  form.append('typedAnswer', text)
  return new Request('http://localhost/api/interviews/sessions/42/turns', {
    method: 'POST',
    body: form,
  })
}

function reqWithAudio(bytes: number) {
  const form = new FormData()
  const file = new File([new Uint8Array(bytes)], 'answer.wav', {
    type: 'audio/wav',
  })
  form.append('audio', file)
  return new Request('http://localhost/api/interviews/sessions/42/turns', {
    method: 'POST',
    body: form,
  })
}

beforeEach(() => vi.clearAllMocks())

describe('handleSubmitInterviewTurn', () => {
  it('returns 400 for an invalid session id', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleSubmitInterviewTurn } = await import('../submitTurn.handler')

    const res = await handleSubmitInterviewTurn(reqWithTypedAnswer('hi'), 'abc')
    expect(res.status).toBe(400)
  })

  it('returns 400 when neither audio nor typedAnswer is present', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    const { handleSubmitInterviewTurn } = await import('../submitTurn.handler')

    const res = await handleSubmitInterviewTurn(
      new Request('http://localhost/x', {
        method: 'POST',
        body: new FormData(),
      }),
      '42',
    )
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_ANSWER_EMPTY',
    })
  })

  it('rejects audio over the configured size cap', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    process.env.INTERVIEW_MAX_ANSWER_SECONDS = '1'
    const { handleSubmitInterviewTurn } = await import('../submitTurn.handler')

    const res = await handleSubmitInterviewTurn(
      reqWithAudio(10 * 1024 * 1024),
      '42',
    )
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'INTERVIEW_ANSWER_AUDIO_TOO_LARGE',
    })
    delete process.env.INTERVIEW_MAX_ANSWER_SECONDS
  })

  it('submits a typed answer and returns the in_progress result', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitInterviewTurn.mockResolvedValueOnce({
      status: 'in_progress',
      transcript: 'hi',
      nextQuestion: 'next?',
    })
    const { handleSubmitInterviewTurn } = await import('../submitTurn.handler')

    const res = await handleSubmitInterviewTurn(reqWithTypedAnswer('hi'), '42')
    expect(res.status).toBe(200)
    expect(hoisted.submitInterviewTurn).toHaveBeenCalledWith({
      userId: 7,
      sessionId: 42,
      answer: { kind: 'typed', text: 'hi' },
    })
  })

  it('submits an audio answer as base64 wav', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitInterviewTurn.mockResolvedValueOnce({
      status: 'in_progress',
      transcript: 'hi',
      nextQuestion: 'next?',
    })
    const { handleSubmitInterviewTurn } = await import('../submitTurn.handler')

    const res = await handleSubmitInterviewTurn(reqWithAudio(100), '42')
    expect(res.status).toBe(200)
    expect(hoisted.submitInterviewTurn).toHaveBeenCalledWith({
      userId: 7,
      sessionId: 42,
      answer: { kind: 'audio', base64: expect.any(String), format: 'wav' },
    })
  })
})
