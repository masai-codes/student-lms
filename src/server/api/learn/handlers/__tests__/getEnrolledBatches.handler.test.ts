import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getEnrolledBatchesForUser: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/learn/services/getEnrolledBatches.service', () => ({
  getEnrolledBatchesForUser: hoisted.getEnrolledBatchesForUser,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

describe('handleGetEnrolledBatches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns batches for authenticated user', async () => {
    const { handleGetEnrolledBatches } = await import('../getEnrolledBatches.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(101)
    hoisted.getEnrolledBatchesForUser.mockResolvedValueOnce([
      { batchId: 1, courseTitle: 'DSA', courseLogo: null },
    ])

    const response = await handleGetEnrolledBatches(
      new Request('http://localhost/api/learn/batches', {
        headers: { cookie: 'session=abc' },
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      batches: [{ batchId: 1, courseTitle: 'DSA', courseLogo: null }],
    })
  })

  it('returns 401 when unauthenticated', async () => {
    const { handleGetEnrolledBatches } = await import('../getEnrolledBatches.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleGetEnrolledBatches(
      new Request('http://localhost/api/learn/batches'),
    )

    expect(response.status).toBe(401)
  })
})
