import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchVideoProgress } from '../fetchVideoProgress'

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => ({ headers: { get: () => 'session=test' } }),
}))

describe('fetchVideoProgress', () => {
  const originalBase = process.env.EXPERIENCE_API_BASE_URL

  beforeEach(() => {
    process.env.EXPERIENCE_API_BASE_URL = 'http://api.test'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalBase === undefined) {
      delete process.env.EXPERIENCE_API_BASE_URL
    } else {
      process.env.EXPERIENCE_API_BASE_URL = originalBase
    }
  })

  it('returns null for invalid lecture id', async () => {
    await expect(fetchVideoProgress(0)).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns progress payload when API succeeds', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          lectureId: 12,
          lastWatchedPosition: 42,
          totalDuration: 100,
          watchPercentage: 40,
        },
      }),
    } as Response)

    await expect(fetchVideoProgress(12)).resolves.toEqual({
      lectureId: 12,
      lastWatchedPosition: 42,
      totalDuration: 100,
      watchPercentage: 40,
    })
  })
})
