import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

describe('fetchZoomRedirectUrlViaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs and returns the url', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({
      url: 'https://zoom.masaischool.com/?token=x',
    })
    const { fetchZoomRedirectUrlViaApi } = await import('../zoomRedirectApi')

    await expect(fetchZoomRedirectUrlViaApi(572)).resolves.toBe(
      'https://zoom.masaischool.com/?token=x',
    )
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/learn/lectures/572/zoom-redirect',
      { method: 'POST' },
    )
  })

  it('maps an API client error to a code-only Error', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(
      new ApiClientError(503, { code: 'ZOOM_REDIRECT_FAILED' }),
    )
    const { fetchZoomRedirectUrlViaApi } = await import('../zoomRedirectApi')

    await expect(fetchZoomRedirectUrlViaApi(572)).rejects.toThrow(
      'ZOOM_REDIRECT_FAILED',
    )
  })

  it('rethrows unexpected (non-API) errors', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(new Error('offline'))
    const { fetchZoomRedirectUrlViaApi } = await import('../zoomRedirectApi')

    await expect(fetchZoomRedirectUrlViaApi(572)).rejects.toThrow('offline')
  })
})
