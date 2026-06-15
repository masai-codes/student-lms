import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  setAdminModeState: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  setAdminModeState: hoisted.setAdminModeState,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function postRequest(body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/admin-mode', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleSetAdminMode', () => {
  it('toggles admin mode and returns the new state', async () => {
    const { handleSetAdminMode } = await import('../handlers/setAdminMode.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.setAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })

    const response = await handleSetAdminMode(postRequest({ enabled: true }, 'session=abc'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ isAdmin: true, enabled: true })
    expect(hoisted.setAdminModeState).toHaveBeenCalledWith(9, true)
  })

  it('returns 400 when "enabled" is not a boolean', async () => {
    const { handleSetAdminMode } = await import('../handlers/setAdminMode.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)

    const response = await handleSetAdminMode(postRequest({ enabled: 'yes' }, 'session=abc'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_ADMIN_MODE_PAYLOAD',
      message: 'INVALID_ADMIN_MODE_PAYLOAD',
    })
    expect(hoisted.setAdminModeState).not.toHaveBeenCalled()
  })

  it('returns 400 when the body is missing entirely', async () => {
    const { handleSetAdminMode } = await import('../handlers/setAdminMode.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)

    const response = await handleSetAdminMode(postRequest(undefined, 'session=abc'))

    expect(response.status).toBe(400)
    expect(hoisted.setAdminModeState).not.toHaveBeenCalled()
  })

  it('returns 401 when there is no session user', async () => {
    const { handleSetAdminMode } = await import('../handlers/setAdminMode.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleSetAdminMode(postRequest({ enabled: true }, null))

    expect(response.status).toBe(401)
    expect(hoisted.setAdminModeState).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service for non-admins', async () => {
    const { handleSetAdminMode } = await import('../handlers/setAdminMode.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.setAdminModeState.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )

    const response = await handleSetAdminMode(postRequest({ enabled: true }, 'session=abc'))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
      message: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleSetAdminMode } = await import('../handlers/setAdminMode.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.setAdminModeState.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleSetAdminMode(postRequest({ enabled: true }, 'session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_UPDATING_ADMIN_MODE',
      message: 'SERVER_ERROR_UPDATING_ADMIN_MODE',
    })
    consoleSpy.mockRestore()
  })
})
