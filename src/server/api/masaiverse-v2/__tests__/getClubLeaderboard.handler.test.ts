import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getClubLeaderboard: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/getClubLeaderboard.service',
  () => ({
    getClubLeaderboard: hoisted.getClubLeaderboard,
  }),
)
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: vi.fn().mockResolvedValue(false),
}))

function getRequest(query: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/clubs/leaderboard${query}`,
    {
      headers: cookie ? { cookie } : {},
    },
  )
}

const RESULT = {
  entries: [
    { rank: 1, userId: '10', name: 'Priya', avatarUrl: null, points: 940 },
  ],
  currentUser: {
    rank: 3,
    userId: '99',
    name: 'Vidit',
    avatarUrl: null,
    points: 300,
  },
}

describe('handleGetClubLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockReset()
  })

  it('returns a leaderboard result, parsing the club id and month period', async () => {
    const { handleGetClubLeaderboard } =
      await import('../handlers/getClubLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getClubLeaderboard.mockResolvedValueOnce(RESULT)

    const response = await handleGetClubLeaderboard(
      getRequest('?clubId=5&period=month', 'session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(RESULT)
    expect(hoisted.getClubLeaderboard).toHaveBeenCalledWith({
      clubId: 5,
      currentUserId: 7,
      period: 'month',
      canSeeUnpublished: false,
    })
  })

  it('defaults to the overall period when omitted', async () => {
    const { handleGetClubLeaderboard } =
      await import('../handlers/getClubLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(7)
    hoisted.getClubLeaderboard.mockResolvedValueOnce(RESULT)

    await handleGetClubLeaderboard(getRequest('?clubId=5', 'session=abc'))
    expect(hoisted.getClubLeaderboard).toHaveBeenCalledWith({
      clubId: 5,
      currentUserId: 7,
      period: 'overall',
      canSeeUnpublished: false,
    })
  })

  it('returns 404 when the club is missing', async () => {
    const { handleGetClubLeaderboard } =
      await import('../handlers/getClubLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(1)
    hoisted.getClubLeaderboard.mockResolvedValueOnce(null)

    const response = await handleGetClubLeaderboard(
      getRequest('?clubId=99', 'session=abc'),
    )
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'CLUB_NOT_FOUND',
    })
  })

  it('returns 401 when there is no session', async () => {
    const { handleGetClubLeaderboard } =
      await import('../handlers/getClubLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleGetClubLeaderboard(
      getRequest('?clubId=5', null),
    )
    expect(response.status).toBe(401)
    expect(hoisted.getClubLeaderboard).not.toHaveBeenCalled()
  })

  it('maps an unexpected service error to 500', async () => {
    const { handleGetClubLeaderboard } =
      await import('../handlers/getClubLeaderboard.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(1)
    hoisted.getClubLeaderboard.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetClubLeaderboard(
      getRequest('?clubId=5', 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_CLUB_LEADERBOARD',
    })
    errorSpy.mockRestore()
  })
})
