import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getGlobalLeaderboard: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service',
  () => ({ getGlobalLeaderboard: hoisted.getGlobalLeaderboard }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function getRequest(query: string, cookie: string | null): Request {
  return new Request(`http://localhost/api/masaiverse-v2/leaderboard${query}`, {
    headers: cookie ? { cookie } : {},
  })
}

const ENTRIES = [
  { rank: 1, userId: '10', name: 'Priya', avatarUrl: null, points: 940 },
]

const RESULT = {
  entries: ENTRIES,
  currentUser: {
    rank: 4,
    userId: '99',
    name: 'Vidit',
    avatarUrl: null,
    points: 120,
  },
}

describe('handleGetGlobalLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the leaderboard result, parsing the limit and month period', async () => {
    const { handleGetGlobalLeaderboard } =
      await import('../handlers/getGlobalLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getGlobalLeaderboard.mockResolvedValueOnce(RESULT)

    const response = await handleGetGlobalLeaderboard(
      getRequest('?limit=5&period=month', 'session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(RESULT)
    expect(hoisted.getGlobalLeaderboard).toHaveBeenCalledWith({
      currentUserId: 7,
      period: 'month',
      limit: 5,
    })
  })

  it('defaults to the overall period and undefined limit when omitted', async () => {
    const { handleGetGlobalLeaderboard } =
      await import('../handlers/getGlobalLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getGlobalLeaderboard.mockResolvedValueOnce(RESULT)

    await handleGetGlobalLeaderboard(getRequest('', 'session=abc'))
    expect(hoisted.getGlobalLeaderboard).toHaveBeenCalledWith({
      currentUserId: 7,
      period: 'overall',
      limit: undefined,
    })
  })

  it('returns 401 when there is no session', async () => {
    const { handleGetGlobalLeaderboard } =
      await import('../handlers/getGlobalLeaderboard.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleGetGlobalLeaderboard(getRequest('', null))
    expect(response.status).toBe(401)
    expect(hoisted.getGlobalLeaderboard).not.toHaveBeenCalled()
  })

  it('maps an unexpected service error to 500', async () => {
    const { handleGetGlobalLeaderboard } =
      await import('../handlers/getGlobalLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(1)
    hoisted.getGlobalLeaderboard.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetGlobalLeaderboard(
      getRequest('', 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_GLOBAL_LEADERBOARD',
    })
    errorSpy.mockRestore()
  })
})
