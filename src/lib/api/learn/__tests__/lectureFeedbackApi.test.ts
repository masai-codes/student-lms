import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

describe('submitLectureFeedbackViaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs rating + feedback to the lecture feedback endpoint', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ rating: 5, text: 'Great' })
    const { submitLectureFeedbackViaApi } =
      await import('../lectureFeedbackApi')

    const result = await submitLectureFeedbackViaApi({
      lectureId: 572,
      rating: 5,
      feedback: 'Great',
    })

    expect(result).toEqual({ rating: 5, text: 'Great' })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/learn/lectures/572/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ rating: 5, feedback: 'Great' }),
      }),
    )
  })

  it('maps an API client error to a code-only Error', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(
      new ApiClientError(409, { code: 'FEEDBACK_WINDOW_CLOSED' }),
    )
    const { submitLectureFeedbackViaApi } =
      await import('../lectureFeedbackApi')

    await expect(
      submitLectureFeedbackViaApi({ lectureId: 572, rating: 5 }),
    ).rejects.toThrow('FEEDBACK_WINDOW_CLOSED')
  })

  it('rethrows unexpected (non-API) errors', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(new Error('offline'))
    const { submitLectureFeedbackViaApi } =
      await import('../lectureFeedbackApi')

    await expect(
      submitLectureFeedbackViaApi({ lectureId: 572, rating: 5 }),
    ).rejects.toThrow('offline')
  })
})
