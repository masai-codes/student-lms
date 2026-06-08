import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  markMasaiverseVisited: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/markMasaiverseVisited.service', () => ({
  markMasaiverseVisited: hoisted.markMasaiverseVisited,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function requestWithCookie(cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/visited', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
  })
}

describe('handleMarkMasaiverseVisited', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks the session user and returns success', async () => {
    const { handleMarkMasaiverseVisited } = await import(
      '../handlers/markMasaiverseVisited.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(99)
    hoisted.markMasaiverseVisited.mockResolvedValueOnce(undefined)

    const response = await handleMarkMasaiverseVisited(
      requestWithCookie('session=abc'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(hoisted.markMasaiverseVisited).toHaveBeenCalledWith(99)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleMarkMasaiverseVisited } = await import(
      '../handlers/markMasaiverseVisited.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handleMarkMasaiverseVisited(requestWithCookie(null))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: 'UNAUTHORIZED',
      message: 'UNAUTHORIZED',
    })
    expect(hoisted.markMasaiverseVisited).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleMarkMasaiverseVisited } = await import(
      '../handlers/markMasaiverseVisited.handler'
    )
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(5)
    hoisted.markMasaiverseVisited.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleMarkMasaiverseVisited(
      requestWithCookie('session=abc'),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_MARKING_MASAIVERSE_VISITED',
      message: 'SERVER_ERROR_MARKING_MASAIVERSE_VISITED',
    })
    consoleSpy.mockRestore()
  })
})
