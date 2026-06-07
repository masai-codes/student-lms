import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getClubEvents: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getClubEvents.service', () => ({
  getClubEvents: hoisted.getClubEvents,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: vi.fn().mockResolvedValue(false),
}))

function getRequest(clubId: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/clubs/events?clubId=${clubId}`,
    { headers: cookie ? { cookie } : {} },
  )
}

const PAYLOAD = { weeklyConnects: [], upcoming: [], past: [] }

describe('handleGetClubEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the event sections for the requested club', async () => {
    const { handleGetClubEvents } = await import(
      '../handlers/getClubEvents.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getClubEvents.mockResolvedValueOnce(PAYLOAD)

    const response = await handleGetClubEvents(getRequest('5', 'session=abc'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(PAYLOAD)
    expect(hoisted.getClubEvents).toHaveBeenCalledWith(5, undefined, false)
  })

  it('returns 404 when the club is missing', async () => {
    const { handleGetClubEvents } = await import(
      '../handlers/getClubEvents.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getClubEvents.mockResolvedValueOnce(null)

    const response = await handleGetClubEvents(getRequest('99', 'session=abc'))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: 'CLUB_NOT_FOUND',
      message: 'CLUB_NOT_FOUND',
    })
  })

  it('returns 401 when there is no session user', async () => {
    const { handleGetClubEvents } = await import(
      '../handlers/getClubEvents.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleGetClubEvents(getRequest('5', null))

    expect(response.status).toBe(401)
    expect(hoisted.getClubEvents).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleGetClubEvents } = await import(
      '../handlers/getClubEvents.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getClubEvents.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetClubEvents(getRequest('5', 'session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_FETCHING_CLUB_EVENTS',
      message: 'SERVER_ERROR_FETCHING_CLUB_EVENTS',
    })
    consoleSpy.mockRestore()
  })
})
