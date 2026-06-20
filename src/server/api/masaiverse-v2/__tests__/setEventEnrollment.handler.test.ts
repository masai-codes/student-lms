import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  setEventEnrollment: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock(
  '@/server/api/masaiverse-v2/services/setEventEnrollment.service',
  () => ({
    setEventEnrollment: hoisted.setEventEnrollment,
  }),
)

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/events/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const STATE = {
  isEnrolled: true,
  enrolledCount: 5,
  redirectUrl: 'https://meet.example/x',
}

describe('handleSetEventEnrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers the user and returns the enrollment state', async () => {
    const { handleSetEventEnrollment } =
      await import('../handlers/setEventEnrollment.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.setEventEnrollment.mockResolvedValueOnce(STATE)

    const response = await handleSetEventEnrollment(
      postRequest({ eventId: '7' }, 'session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(STATE)
    expect(hoisted.setEventEnrollment).toHaveBeenCalledWith(1, 7)
  })

  it('coerces a missing body to NaN so the service can reject it', async () => {
    const { handleSetEventEnrollment } =
      await import('../handlers/setEventEnrollment.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.setEventEnrollment.mockResolvedValueOnce(STATE)

    await handleSetEventEnrollment(postRequest(undefined, 'session=abc'))

    expect(hoisted.setEventEnrollment).toHaveBeenCalledWith(1, Number.NaN)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleSetEventEnrollment } =
      await import('../handlers/setEventEnrollment.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleSetEventEnrollment(
      postRequest({ eventId: '7' }, null),
    )

    expect(response.status).toBe(401)
    expect(hoisted.setEventEnrollment).not.toHaveBeenCalled()
  })

  it('propagates a service ApiError (e.g. event not found)', async () => {
    const { handleSetEventEnrollment } =
      await import('../handlers/setEventEnrollment.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.setEventEnrollment.mockRejectedValueOnce(
      new ApiError(404, 'EVENT_NOT_FOUND'),
    )

    const response = await handleSetEventEnrollment(
      postRequest({ eventId: '99' }, 'session=abc'),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: 'EVENT_NOT_FOUND',
      message: 'EVENT_NOT_FOUND',
    })
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleSetEventEnrollment } =
      await import('../handlers/setEventEnrollment.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(1)
    hoisted.setEventEnrollment.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleSetEventEnrollment(
      postRequest({ eventId: '7' }, 'session=abc'),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_ENROLLING_EVENT',
      message: 'SERVER_ERROR_ENROLLING_EVENT',
    })
    consoleSpy.mockRestore()
  })
})
