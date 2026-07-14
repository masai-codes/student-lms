import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

const input = {
  lectureId: 572,
  totalDuration: 600,
  intervals: [{ start: 0, end: 30 }],
}

describe('storeLectureVideoProgressViaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs the payload to the video-progress endpoint', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ ok: true })
    const { storeLectureVideoProgressViaApi } =
      await import('../videoProgressApi')

    const result = await storeLectureVideoProgressViaApi(input)

    expect(result).toEqual({ ok: true })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/learn/lectures/572/video-progress',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          totalDuration: 600,
          intervals: [{ start: 0, end: 30 }],
          sessionToken: undefined,
        }),
      }),
    )
  })

  it('resolves to { ok: false } on an API client error', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(
      new ApiClientError(401, { code: 'UNAUTHORIZED' }),
    )
    const { storeLectureVideoProgressViaApi } =
      await import('../videoProgressApi')

    await expect(storeLectureVideoProgressViaApi(input)).resolves.toEqual({
      ok: false,
    })
  })

  it('rethrows unexpected (non-API) errors', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(new Error('network down'))
    const { storeLectureVideoProgressViaApi } =
      await import('../videoProgressApi')

    await expect(storeLectureVideoProgressViaApi(input)).rejects.toThrow(
      'network down',
    )
  })
})
