import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getEventDetail: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getEventDetail.service', () => ({
  getEventDetail: hoisted.getEventDetail,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function getRequest(eventId: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/events/detail?eventId=${eventId}`,
    { headers: cookie ? { cookie } : {} },
  )
}

const PAYLOAD = { id: '7', title: 'Build Sprint' }

describe('handleGetEventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the event detail for the requested id', async () => {
    const { handleGetEventDetail } = await import(
      '../handlers/getEventDetail.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getEventDetail.mockResolvedValueOnce(PAYLOAD)

    const response = await handleGetEventDetail(getRequest('7', 'session=abc'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(PAYLOAD)
    expect(hoisted.getEventDetail).toHaveBeenCalledWith(7, 1)
  })

  it('returns 404 when the event is missing', async () => {
    const { handleGetEventDetail } = await import(
      '../handlers/getEventDetail.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getEventDetail.mockResolvedValueOnce(null)

    const response = await handleGetEventDetail(getRequest('99', 'session=abc'))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: 'EVENT_NOT_FOUND',
      message: 'EVENT_NOT_FOUND',
    })
  })

  it('returns 401 when there is no session user', async () => {
    const { handleGetEventDetail } = await import(
      '../handlers/getEventDetail.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleGetEventDetail(getRequest('7', null))

    expect(response.status).toBe(401)
    expect(hoisted.getEventDetail).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleGetEventDetail } = await import(
      '../handlers/getEventDetail.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.getEventDetail.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetEventDetail(getRequest('7', 'session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_FETCHING_EVENT_DETAIL',
      message: 'SERVER_ERROR_FETCHING_EVENT_DETAIL',
    })
    consoleSpy.mockRestore()
  })
})
