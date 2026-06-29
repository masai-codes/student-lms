import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'

const hoisted = vi.hoisted(() => ({
  getAssignmentProblemDetailForUser: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/learn/services/getProblemDetail.service', () => ({
  getAssignmentProblemDetailForUser: hoisted.getAssignmentProblemDetailForUser,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

function request(cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/assignments/99/problems/12', {
    headers: cookie ? { cookie } : {},
  })
}

describe('handleGetProblemDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserIdFromCookieHeader.mockResolvedValue(7)
  })

  it('returns the problem detail payload for an authenticated user', async () => {
    const { handleGetProblemDetail } = await import('../getProblemDetail.handler')
    const payload = { problemId: 12, type: 'LINK' }
    hoisted.getAssignmentProblemDetailForUser.mockResolvedValueOnce(payload)

    const response = await handleGetProblemDetail(request(), '99', '12')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(hoisted.getAssignmentProblemDetailForUser).toHaveBeenCalledWith(7, 99, 12)
  })

  it('returns 401 when unauthenticated', async () => {
    const { handleGetProblemDetail } = await import('../getProblemDetail.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleGetProblemDetail(request(null), '99', '12')

    expect(response.status).toBe(401)
    expect(hoisted.getAssignmentProblemDetailForUser).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid problem id', async () => {
    const { handleGetProblemDetail } = await import('../getProblemDetail.handler')

    const response = await handleGetProblemDetail(request(), '99', '0')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_PROBLEM_ID' })
  })

  it('maps a not-found error to 404', async () => {
    const { handleGetProblemDetail } = await import('../getProblemDetail.handler')
    hoisted.getAssignmentProblemDetailForUser.mockRejectedValueOnce(
      new Error('LEARN_DETAIL_NOT_FOUND'),
    )

    const response = await handleGetProblemDetail(request(), '99', '12')

    // 404 ships on the CloudFront-safe wire status with the true status in a header.
    expect(resolveTrueStatus(response)).toBe(404)
  })
})
