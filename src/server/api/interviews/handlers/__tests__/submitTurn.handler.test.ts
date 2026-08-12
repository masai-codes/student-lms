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

function reqWithTranscribedAnswer(text: string) {
  const form = new FormData()
  form.append('transcribedAnswer', text)
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

  it('returns 400 when neither transcribedAnswer nor typedAnswer is present', async () => {
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

  it('submits a typed answer and returns the in_progress result', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitInterviewTurn.mockResolvedValueOnce({
      status: 'in_progress',
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

  it('submits a transcribed answer', async () => {
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.submitInterviewTurn.mockResolvedValueOnce({
      status: 'in_progress',
      nextQuestion: 'next?',
    })
    const { handleSubmitInterviewTurn } = await import('../submitTurn.handler')

    const res = await handleSubmitInterviewTurn(
      reqWithTranscribedAnswer('hi there'),
      '42',
    )
    expect(res.status).toBe(200)
    expect(hoisted.submitInterviewTurn).toHaveBeenCalledWith({
      userId: 7,
      sessionId: 42,
      answer: { kind: 'transcribed', text: 'hi there' },
    })
  })
})
