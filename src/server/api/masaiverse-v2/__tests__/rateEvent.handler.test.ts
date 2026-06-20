import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rateEvent: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/rateEvent.service', () => ({
  rateEvent: hoisted.rateEvent,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/events/rate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const STATE = { rating: 4, feedback: 'Great event' }

describe('handleRateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rates the event and returns the rating state', async () => {
    const { handleRateEvent } = await import('../handlers/rateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.rateEvent.mockResolvedValueOnce(STATE)

    const response = await handleRateEvent(
      postRequest(
        { eventId: '7', rating: 4, feedback: 'Great event' },
        'session=abc',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(STATE)
    expect(hoisted.rateEvent).toHaveBeenCalledWith(1, 7, 4, 'Great event')
  })

  it('returns 401 when there is no session user', async () => {
    const { handleRateEvent } = await import('../handlers/rateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleRateEvent(
      postRequest({ eventId: '7', rating: 4 }, null),
    )

    expect(response.status).toBe(401)
    expect(hoisted.rateEvent).not.toHaveBeenCalled()
  })

  it('propagates a service ApiError (e.g. already rated)', async () => {
    const { handleRateEvent } = await import('../handlers/rateEvent.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.rateEvent.mockRejectedValueOnce(new ApiError(409, 'ALREADY_RATED'))

    const response = await handleRateEvent(
      postRequest({ eventId: '7', rating: 4 }, 'session=abc'),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: 'ALREADY_RATED',
      message: 'ALREADY_RATED',
    })
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleRateEvent } = await import('../handlers/rateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.rateEvent.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleRateEvent(
      postRequest({ eventId: '7', rating: 4 }, 'session=abc'),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_RATING_EVENT',
      message: 'SERVER_ERROR_RATING_EVENT',
    })
    consoleSpy.mockRestore()
  })
})
