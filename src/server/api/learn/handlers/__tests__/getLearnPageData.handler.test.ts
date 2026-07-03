import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getLearnPageData: vi.fn(),
}))

vi.mock('@/server/learn/services/getLearnPageData.service', () => ({
  getLearnPageData: hoisted.getLearnPageData,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function request(query: string, cookie = 'session=abc') {
  return new Request(`http://localhost/api/learn/page?${query}`, {
    headers: cookie ? { cookie } : {},
  })
}

describe('handleGetLearnPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockReset()
    vi.mocked(requireSessionUserId).mockResolvedValue(101)
  })

  it('returns the combined page payload for an authenticated user', async () => {
    const { handleGetLearnPageData } =
      await import('../getLearnPageData.handler')
    const payload = { batches: [], selectedBatchId: null, learningItems: [] }
    hoisted.getLearnPageData.mockResolvedValueOnce(payload)

    const response = await handleGetLearnPageData(
      request('learningType=lecture'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(hoisted.getLearnPageData).toHaveBeenCalledWith(
      expect.objectContaining({ learningType: 'lecture' }),
      101,
    )
  })

  it('returns 401 when unauthenticated', async () => {
    const { handleGetLearnPageData } =
      await import('../getLearnPageData.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleGetLearnPageData(
      request('learningType=lecture', ''),
    )
    expect(response.status).toBe(401)
  })

  it('maps a bad learningType to a 400', async () => {
    const { handleGetLearnPageData } =
      await import('../getLearnPageData.handler')
    const response = await handleGetLearnPageData(request('learningType=bogus'))
    expect(response.status).toBe(400)
  })

  it('maps an unexpected service failure to a stable 500', async () => {
    const { handleGetLearnPageData } =
      await import('../getLearnPageData.handler')
    hoisted.getLearnPageData.mockRejectedValueOnce(new Error('db down'))

    const response = await handleGetLearnPageData(
      request('learningType=lecture'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_LEARN_PAGE_DATA',
    })
  })
})
