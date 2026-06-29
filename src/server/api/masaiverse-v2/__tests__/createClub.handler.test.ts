import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  createMasaiverseClub: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/createClub.service', () => ({
  createMasaiverseClub: hoisted.createMasaiverseClub,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/clubs/create', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleCreateClub', () => {
  it('creates a club for the admin and returns 201 with the id', async () => {
    const { handleCreateClub } = await import('../handlers/createClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(4)
    hoisted.createMasaiverseClub.mockResolvedValueOnce({ id: '31' })

    const response = await handleCreateClub(postRequest('session=abc'))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: '31' })
    expect(hoisted.createMasaiverseClub).toHaveBeenCalledWith(4)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleCreateClub } = await import('../handlers/createClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleCreateClub(postRequest(null))

    expect(response.status).toBe(401)
    expect(hoisted.createMasaiverseClub).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service for non-admins', async () => {
    const { handleCreateClub } = await import('../handlers/createClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(4)
    hoisted.createMasaiverseClub.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const response = await handleCreateClub(postRequest('session=abc'))

    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('403')
    await expect(response.json()).resolves.toEqual({
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
      message: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleCreateClub } = await import('../handlers/createClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(4)
    hoisted.createMasaiverseClub.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleCreateClub(postRequest('session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_CREATING_CLUB',
      message: 'SERVER_ERROR_CREATING_CLUB',
    })
    consoleSpy.mockRestore()
  })
})
