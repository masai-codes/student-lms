import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getGlobalLeaderboard: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service',
  () => ({ getGlobalLeaderboard: hoisted.getGlobalLeaderboard }),
)
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function getRequest(query: string, cookie: string | null): Request {
  return new Request(`http://localhost/api/masaiverse-v2/leaderboard${query}`, {
    headers: cookie ? { cookie } : {},
  })
}

const ENTRIES = [
  { rank: 1, userId: '10', name: 'Priya', avatarUrl: null, points: 940 },
]

describe('handleGetGlobalLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the leaderboard entries, parsing the limit', async () => {
    const { handleGetGlobalLeaderboard } = await import(
      '../handlers/getGlobalLeaderboard.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getGlobalLeaderboard.mockResolvedValueOnce(ENTRIES)

    const response = await handleGetGlobalLeaderboard(
      getRequest('?limit=5', 'session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ entries: ENTRIES })
    expect(hoisted.getGlobalLeaderboard).toHaveBeenCalledWith(5)
  })

  it('passes undefined when no limit is given', async () => {
    const { handleGetGlobalLeaderboard } = await import(
      '../handlers/getGlobalLeaderboard.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getGlobalLeaderboard.mockResolvedValueOnce([])

    await handleGetGlobalLeaderboard(getRequest('', 'session=abc'))
    expect(hoisted.getGlobalLeaderboard).toHaveBeenCalledWith(undefined)
  })

  it('returns 401 when there is no session', async () => {
    const { handleGetGlobalLeaderboard } = await import(
      '../handlers/getGlobalLeaderboard.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleGetGlobalLeaderboard(getRequest('', null))
    expect(response.status).toBe(401)
    expect(hoisted.getGlobalLeaderboard).not.toHaveBeenCalled()
  })

  it('maps an unexpected service error to 500', async () => {
    const { handleGetGlobalLeaderboard } = await import(
      '../handlers/getGlobalLeaderboard.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
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
