import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  genToken: vi.fn(),
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
vi.mock('@/db/schema', () => ({ users: {}, lectures: {}, batches: {} }))
vi.mock('@/server/learn/utils/zoomRedirectionToken', () => ({
  generateZoomRedirectionToken: hoisted.genToken,
}))

const USER = [{ id: 7, role: 'student', name: 'Asha', email: 'a@x.com' }]

describe('getZoomRedirectUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.genToken.mockResolvedValue({ ok: true, token: 'tok' })
  })

  it('builds a Masai ZEF url for non-iHub batches', async () => {
    hoisted.selectQueue = [USER, [{ batchId: 5 }], [{ duration: 'sprint' }]]
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).resolves.toBe(
      'https://zoom.masaischool.com/?token=tok',
    )
    expect(hoisted.genToken).toHaveBeenCalledWith({
      lectureId: '572',
      user: USER[0],
    })
  })

  it('builds an iHub ZEF url for iHub batches', async () => {
    hoisted.selectQueue = [USER, [{ batchId: 5 }], [{ duration: 'ihub' }]]
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).resolves.toBe(
      'https://zoom.ihubiitrcourses.org/?token=tok',
    )
  })

  it('defaults to Masai when the lecture has no batch', async () => {
    hoisted.selectQueue = [USER, [{ batchId: null }]]
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).resolves.toBe(
      'https://zoom.masaischool.com/?token=tok',
    )
  })

  it('throws when the user is missing', async () => {
    hoisted.selectQueue = [[]]
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).rejects.toThrow('ZOOM_REDIRECT_FAILED')
  })

  it('maps a forbidden token result to ZOOM_REDIRECT_FORBIDDEN', async () => {
    hoisted.selectQueue = [USER]
    hoisted.genToken.mockResolvedValueOnce({ ok: false, status: 403, message: 'no' })
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).rejects.toThrow(
      'ZOOM_REDIRECT_FORBIDDEN',
    )
  })

  it('maps other token failures to ZOOM_REDIRECT_FAILED', async () => {
    hoisted.selectQueue = [USER]
    hoisted.genToken.mockResolvedValueOnce({ ok: false, status: 500, message: 'x' })
    const { getZoomRedirectUrl } = await import('../zoomRedirect.service')

    await expect(getZoomRedirectUrl(7, 572)).rejects.toThrow('ZOOM_REDIRECT_FAILED')
  })
})
