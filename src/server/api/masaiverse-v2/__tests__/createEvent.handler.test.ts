import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  createMasaiverseEvent: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/createEvent.service', () => ({
  createMasaiverseEvent: hoisted.createMasaiverseEvent,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/events/create', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleCreateEvent', () => {
  it('creates an event for the admin and returns 201 with the id', async () => {
    const { handleCreateEvent } =
      await import('../handlers/createEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.createMasaiverseEvent.mockResolvedValueOnce({ id: '77' })

    const response = await handleCreateEvent(postRequest('session=abc'))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: '77' })
    expect(hoisted.createMasaiverseEvent).toHaveBeenCalledWith(9)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleCreateEvent } =
      await import('../handlers/createEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleCreateEvent(postRequest(null))

    expect(response.status).toBe(401)
    expect(hoisted.createMasaiverseEvent).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service for non-admins', async () => {
    const { handleCreateEvent } =
      await import('../handlers/createEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.createMasaiverseEvent.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const response = await handleCreateEvent(postRequest('session=abc'))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
      message: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleCreateEvent } =
      await import('../handlers/createEvent.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.createMasaiverseEvent.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleCreateEvent(postRequest('session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_CREATING_EVENT',
      message: 'SERVER_ERROR_CREATING_EVENT',
    })
    consoleSpy.mockRestore()
  })
})
