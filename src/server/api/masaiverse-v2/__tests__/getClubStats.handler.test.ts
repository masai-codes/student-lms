import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getClubStats: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getClubStats.service', () => ({
  getClubStats: hoisted.getClubStats,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: vi.fn().mockResolvedValue(false),
}))

function getRequest(clubId: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/clubs/stats?clubId=${clubId}`,
    { headers: cookie ? { cookie } : {} },
  )
}

const STATS = {
  activeMembers: 234,
  avgEventRating: 4.8,
  projectsBuilt: 91,
  communityPosts: 61,
}

describe('handleGetClubStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the stats for the requested club', async () => {
    const { handleGetClubStats } =
      await import('../handlers/getClubStats.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getClubStats.mockResolvedValueOnce(STATS)

    const response = await handleGetClubStats(getRequest('5', 'session=abc'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(STATS)
    expect(hoisted.getClubStats).toHaveBeenCalledWith(5, undefined, false)
  })

  it('returns 404 when the club is missing', async () => {
    const { handleGetClubStats } =
      await import('../handlers/getClubStats.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getClubStats.mockResolvedValueOnce(null)

    const response = await handleGetClubStats(getRequest('99', 'session=abc'))

    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toEqual({
      code: 'CLUB_NOT_FOUND',
      message: 'CLUB_NOT_FOUND',
    })
  })

  it('returns 401 when there is no session user', async () => {
    const { handleGetClubStats } =
      await import('../handlers/getClubStats.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleGetClubStats(getRequest('5', null))

    expect(response.status).toBe(401)
    expect(hoisted.getClubStats).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleGetClubStats } =
      await import('../handlers/getClubStats.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getClubStats.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetClubStats(getRequest('5', 'session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_FETCHING_CLUB_STATS',
      message: 'SERVER_ERROR_FETCHING_CLUB_STATS',
    })
    consoleSpy.mockRestore()
  })
})
