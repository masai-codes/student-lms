import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getUrl: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/learn/services/zoomRedirect.service', () => ({
  getZoomRedirectUrl: hoisted.getUrl,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function request(cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/lectures/572/zoom-redirect', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
  })
}

async function loadHandler() {
  const mod = await import('../zoomRedirect.handler')
  return mod.handleGetZoomRedirect
}

describe('zoomRedirect.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserIdFromCookieHeader.mockResolvedValue(7)
    hoisted.getUrl.mockResolvedValue('https://zoom.masaischool.com/?token=x')
  })

  it('returns the resolved ZEF url', async () => {
    const handle = await loadHandler()
    const res = await handle(request(), '572')

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      url: 'https://zoom.masaischool.com/?token=x',
    })
    expect(hoisted.getUrl).toHaveBeenCalledWith(7, 572)
  })

  it('returns 401 when unauthenticated', async () => {
    const handle = await loadHandler()
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const res = await handle(request(null), '572')

    expect(res.status).toBe(401)
    expect(hoisted.getUrl).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid lecture id', async () => {
    const handle = await loadHandler()

    const res = await handle(request(), '0')

    expect(res.status).toBe(400)
    expect(hoisted.getUrl).not.toHaveBeenCalled()
  })

  it('maps an upstream failure to 503', async () => {
    const handle = await loadHandler()
    hoisted.getUrl.mockRejectedValueOnce(new Error('ZOOM_REDIRECT_FAILED'))

    const res = await handle(request(), '572')

    expect(res.status).toBe(503)
  })
})
