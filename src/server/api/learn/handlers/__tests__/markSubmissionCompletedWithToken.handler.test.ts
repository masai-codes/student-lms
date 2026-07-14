import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleMarkSubmissionCompletedWithToken } from '../assignmentDetailActions.handler'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  markSubmissionCompletedWithToken: vi.fn(),
}))

// The handler module transitively imports services that open a DB connection
// at load time; stub it so the handler unit test stays isolated.
vi.mock('@/db', () => ({ db: {} }))
vi.mock(
  '@/server/assignments/services/markSubmissionCompletedWithToken',
  () => ({
    markSubmissionCompletedWithToken: hoisted.markSubmissionCompletedWithToken,
  }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function tokenRequest(body: unknown, cookie: string | null = 'session=abc') {
  return new Request(
    'http://localhost/api/learn/assignments/10/mark-completed-with-token',
    {
      method: 'POST',
      headers: cookie ? { cookie } : {},
      body: JSON.stringify(body),
    },
  )
}

describe('handleMarkSubmissionCompletedWithToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.markSubmissionCompletedWithToken.mockResolvedValue({
      markAsCompleted: true,
    })
  })

  it('marks the submission complete with the token', async () => {
    const response = await handleMarkSubmissionCompletedWithToken(
      tokenRequest({ token: 'abc123' }),
      '10',
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ markAsCompleted: true })
    expect(hoisted.markSubmissionCompletedWithToken).toHaveBeenCalledWith({
      userId: 7,
      assignmentId: 10,
      token: 'abc123',
    })
  })

  it('passes an empty token through when the body omits it', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.markSubmissionCompletedWithToken.mockRejectedValueOnce(
      new ApiError(400, 'TOKEN_REQUIRED'),
    )

    const response = await handleMarkSubmissionCompletedWithToken(
      tokenRequest({}),
      '10',
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'TOKEN_REQUIRED',
    })
    expect(hoisted.markSubmissionCompletedWithToken).toHaveBeenCalledWith({
      userId: 7,
      assignmentId: 10,
      token: '',
    })
  })

  it('rejects an invalid assignment id with 400', async () => {
    const response = await handleMarkSubmissionCompletedWithToken(
      tokenRequest({ token: 'abc123' }),
      'not-a-number',
    )

    expect(response.status).toBe(400)
    expect(hoisted.markSubmissionCompletedWithToken).not.toHaveBeenCalled()
  })

  it('returns 401 for an unauthenticated request', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleMarkSubmissionCompletedWithToken(
      tokenRequest({ token: 'abc123' }, null),
      '10',
    )

    expect(response.status).toBe(401)
    expect(hoisted.markSubmissionCompletedWithToken).not.toHaveBeenCalled()
  })
})
