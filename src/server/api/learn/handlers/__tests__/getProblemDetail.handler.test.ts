import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getAssignmentProblemDetailForUser: vi.fn(),
}))

vi.mock('@/server/learn/services/getProblemDetail.service', () => ({
  getAssignmentProblemDetailForUser: hoisted.getAssignmentProblemDetailForUser,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

describe('handleGetProblemDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
  })

  it('returns the problem detail payload for an authenticated user', async () => {
    const { handleGetProblemDetail } =
      await import('../getProblemDetail.handler')
    const payload = { problemId: 12, type: 'LINK' }
    hoisted.getAssignmentProblemDetailForUser.mockResolvedValueOnce(payload)

    const response = await handleGetProblemDetail('99', '12')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(hoisted.getAssignmentProblemDetailForUser).toHaveBeenCalledWith(
      7,
      99,
      12,
    )
  })

  it('returns 401 when unauthenticated', async () => {
    const { handleGetProblemDetail } =
      await import('../getProblemDetail.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleGetProblemDetail('99', '12')

    expect(response.status).toBe(401)
    expect(hoisted.getAssignmentProblemDetailForUser).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid problem id', async () => {
    const { handleGetProblemDetail } =
      await import('../getProblemDetail.handler')

    const response = await handleGetProblemDetail('99', '0')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_PROBLEM_ID',
    })
  })

  it('maps a not-found error to 404', async () => {
    const { handleGetProblemDetail } =
      await import('../getProblemDetail.handler')
    hoisted.getAssignmentProblemDetailForUser.mockRejectedValueOnce(
      new Error('LEARN_DETAIL_NOT_FOUND'),
    )

    const response = await handleGetProblemDetail('99', '12')

    // 404 ships on the CloudFront-safe wire status with the true status in a header.
    expect(resolveTrueStatus(response)).toBe(404)
  })
})
