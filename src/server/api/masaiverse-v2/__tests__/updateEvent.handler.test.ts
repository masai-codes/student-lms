import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  updateMasaiverseEvent: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/updateEvent.service', () => ({
  updateMasaiverseEvent: hoisted.updateMasaiverseEvent,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/events/update', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleUpdateEvent', () => {
  it('forwards the parsed patch to the service and returns success', async () => {
    const { handleUpdateEvent } = await import('../handlers/updateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.updateMasaiverseEvent.mockResolvedValueOnce({ success: true })

    const response = await handleUpdateEvent(
      postRequest(
        { eventId: '5', column: { title: 'X' }, meta: { aboveTitle: 'A' } },
        'session=abc',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(hoisted.updateMasaiverseEvent).toHaveBeenCalledWith(9, {
      eventId: 5,
      column: { title: 'X' },
      meta: { aboveTitle: 'A' },
    })
  })

  it('returns 401 without a session', async () => {
    const { handleUpdateEvent } = await import('../handlers/updateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleUpdateEvent(postRequest({ eventId: 5 }, null))
    expect(response.status).toBe(401)
    expect(hoisted.updateMasaiverseEvent).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service', async () => {
    const { handleUpdateEvent } = await import('../handlers/updateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.updateMasaiverseEvent.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const response = await handleUpdateEvent(
      postRequest({ eventId: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(403)
  })

  it('maps unexpected failures to a 500 error', async () => {
    const { handleUpdateEvent } = await import('../handlers/updateEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.updateMasaiverseEvent.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleUpdateEvent(
      postRequest({ eventId: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_UPDATING_EVENT',
      message: 'SERVER_ERROR_UPDATING_EVENT',
    })
    consoleSpy.mockRestore()
  })
})
