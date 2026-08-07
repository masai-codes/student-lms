import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  genUrl: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
        }),
      }),
    }),
  },
}))
vi.mock('@/db/schema', () => ({ users: {} }))
vi.mock('@/server/learn/utils/zoomRedirectionToken', () => ({
  generateZoomRedirectionUrl: hoisted.genUrl,
}))

const USER = [{ id: 7, role: 'student', name: 'Asha', email: 'a@x.com' }]

describe('getZoomRedirectUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.genUrl.mockResolvedValue({
      ok: true,
      url: 'https://zoom.masaischool.com/?token=tok',
    })
  })

  it('returns the minted url for the session user', async () => {
    hoisted.selectQueue = [USER]
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).resolves.toBe(
      'https://zoom.masaischool.com/?token=tok',
    )
    expect(hoisted.genUrl).toHaveBeenCalledWith({
      lectureId: '572',
      user: USER[0],
    })
  })

  it('passes through an IVS url unchanged', async () => {
    hoisted.selectQueue = [USER]
    hoisted.genUrl.mockResolvedValueOnce({
      ok: true,
      url: 'https://zef-ivs.iasam.dev/?token=tok',
    })
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).resolves.toBe(
      'https://zef-ivs.iasam.dev/?token=tok',
    )
  })

  it('throws when the user is missing', async () => {
    hoisted.selectQueue = [[]]
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).rejects.toThrow(
      'ZOOM_REDIRECT_FAILED',
    )
  })

  it('maps a forbidden token result to ZOOM_REDIRECT_FORBIDDEN', async () => {
    hoisted.selectQueue = [USER]
    hoisted.genUrl.mockResolvedValueOnce({
      ok: false,
      status: 403,
      message: 'no',
    })
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).rejects.toThrow(
      'ZOOM_REDIRECT_FORBIDDEN',
    )
  })

  it('maps other token failures to ZOOM_REDIRECT_FAILED', async () => {
    hoisted.selectQueue = [USER]
    hoisted.genUrl.mockResolvedValueOnce({
      ok: false,
      status: 500,
      message: 'x',
    })
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).rejects.toThrow(
      'ZOOM_REDIRECT_FAILED',
    )
  })
})
