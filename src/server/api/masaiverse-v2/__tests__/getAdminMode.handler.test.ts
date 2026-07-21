import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getAdminModeState: vi.fn(),
  getCurrentUserId: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getCurrentUserId,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleGetAdminMode', () => {
  it('returns the admin-mode state for the session user', async () => {
    const { handleGetAdminMode } =
      await import('../handlers/getAdminMode.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(42)
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })

    const response = await handleGetAdminMode()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      isAdmin: true,
      enabled: true,
    })
    expect(hoisted.getAdminModeState).toHaveBeenCalledWith(42)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleGetAdminMode } =
      await import('../handlers/getAdminMode.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(null)

    const response = await handleGetAdminMode()

    expect(response.status).toBe(401)
    expect(hoisted.getAdminModeState).not.toHaveBeenCalled()
  })

  it('maps unexpected failures to a 500 error', async () => {
    const { handleGetAdminMode } =
      await import('../handlers/getAdminMode.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(42)
    hoisted.getAdminModeState.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetAdminMode()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_FETCHING_ADMIN_MODE',
      message: 'SERVER_ERROR_FETCHING_ADMIN_MODE',
    })
    consoleSpy.mockRestore()
  })
})
