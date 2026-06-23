import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  getBanners: vi.fn(),
  createBanner: vi.fn(),
  updateBanner: vi.fn(),
  deleteBanner: vi.fn(),
  canSeeUnpublished: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getBanners.service', () => ({
  getMasaiverseBanners: hoisted.getBanners,
}))
vi.mock('@/server/api/masaiverse-v2/services/createBanner.service', () => ({
  createMasaiverseBanner: hoisted.createBanner,
}))
vi.mock('@/server/api/masaiverse-v2/services/updateBanner.service', () => ({
  updateMasaiverseBanner: hoisted.updateBanner,
}))
vi.mock('@/server/api/masaiverse-v2/services/deleteBanner.service', () => ({
  deleteMasaiverseBanner: hoisted.deleteBanner,
}))
vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: hoisted.canSeeUnpublished,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function req(method: string, body: unknown, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/banners', {
    method,
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('banner handlers', () => {
  it('GET returns banners scoped by canSeeUnpublished', async () => {
    const { handleGetBanners } = await import('../handlers/getBanners.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.canSeeUnpublished.mockResolvedValueOnce(true)
    hoisted.getBanners.mockResolvedValueOnce([{ id: '1' }])

    const response = await handleGetBanners(
      req('GET', undefined, 'session=abc'),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ banners: [{ id: '1' }] })
    expect(hoisted.getBanners).toHaveBeenCalledWith(true)
  })

  it('GET returns 401 without a session', async () => {
    const { handleGetBanners } = await import('../handlers/getBanners.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)
    const response = await handleGetBanners(req('GET', undefined, null))
    expect(response.status).toBe(401)
    expect(hoisted.getBanners).not.toHaveBeenCalled()
  })

  it('POST create returns 201 with the new id', async () => {
    const { handleCreateBanner } =
      await import('../handlers/createBanner.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.createBanner.mockResolvedValueOnce({ id: '12' })
    const response = await handleCreateBanner(
      req('POST', undefined, 'session=abc'),
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: '12' })
  })

  it('POST update forwards the parsed patch', async () => {
    const { handleUpdateBanner } =
      await import('../handlers/updateBanner.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.updateBanner.mockResolvedValueOnce({ success: true })
    const response = await handleUpdateBanner(
      req(
        'POST',
        { bannerId: '5', meta: { isPublished: true } },
        'session=abc',
      ),
    )
    expect(response.status).toBe(200)
    expect(hoisted.updateBanner).toHaveBeenCalledWith(9, {
      bannerId: 5,
      column: undefined,
      meta: { isPublished: true },
    })
  })

  it('POST update propagates the service 403', async () => {
    const { handleUpdateBanner } =
      await import('../handlers/updateBanner.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.updateBanner.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )
    const response = await handleUpdateBanner(
      req('POST', { bannerId: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('403')
  })

  it('POST delete forwards the banner id', async () => {
    const { handleDeleteBanner } =
      await import('../handlers/deleteBanner.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.deleteBanner.mockResolvedValueOnce({ success: true })
    const response = await handleDeleteBanner(
      req('POST', { bannerId: '5' }, 'session=abc'),
    )
    expect(response.status).toBe(200)
    expect(hoisted.deleteBanner).toHaveBeenCalledWith(9, 5)
  })

  it('maps an unexpected delete failure to a 500', async () => {
    const { handleDeleteBanner } =
      await import('../handlers/deleteBanner.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.deleteBanner.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleDeleteBanner(
      req('POST', { bannerId: 5 }, 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_DELETING_BANNER',
    })
    consoleSpy.mockRestore()
  })
})
