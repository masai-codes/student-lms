import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  updateMasaiverseClub: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/updateClub.service', () => ({
  updateMasaiverseClub: hoisted.updateMasaiverseClub,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/clubs/update', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleUpdateClub', () => {
  it('forwards the parsed patch to the service and returns success', async () => {
    const { handleUpdateClub } = await import('../handlers/updateClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(4)
    hoisted.updateMasaiverseClub.mockResolvedValueOnce({ success: true })

    const response = await handleUpdateClub(
      postRequest(
        { clubId: '5', meta: { description: 'About' } },
        'session=abc',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(hoisted.updateMasaiverseClub).toHaveBeenCalledWith(4, {
      clubId: 5,
      column: undefined,
      meta: { description: 'About' },
    })
  })

  it('returns 401 without a session', async () => {
    const { handleUpdateClub } = await import('../handlers/updateClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleUpdateClub(postRequest({ clubId: 5 }, null))
    expect(response.status).toBe(401)
    expect(hoisted.updateMasaiverseClub).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service', async () => {
    const { handleUpdateClub } = await import('../handlers/updateClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(4)
    hoisted.updateMasaiverseClub.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const response = await handleUpdateClub(
      postRequest({ clubId: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('403')
  })

  it('maps unexpected failures to a 500 error', async () => {
    const { handleUpdateClub } = await import('../handlers/updateClub.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(4)
    hoisted.updateMasaiverseClub.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleUpdateClub(
      postRequest({ clubId: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_UPDATING_CLUB',
      message: 'SERVER_ERROR_UPDATING_CLUB',
    })
    consoleSpy.mockRestore()
  })
})
