import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  searchUsers: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/searchUsers.service', () => ({
  searchUsers: hoisted.searchUsers,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function getRequest(query: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/users/search${query}`,
    { headers: cookie ? { cookie } : {} },
  )
}

const USERS = [{ id: '10', name: 'Priya', email: 'p@x.com', avatarUrl: null }]

beforeEach(() => {
  vi.clearAllMocks()
})

async function load() {
  return (await import('../handlers/searchUsers.handler')).handleSearchUsers
}

describe('handleSearchUsers', () => {
  it('returns matched users, forwarding the q param', async () => {
    const handle = await load()
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)
    hoisted.searchUsers.mockResolvedValueOnce(USERS)

    const response = await handle(getRequest('?q=pri', 'session=abc'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ users: USERS })
    expect(hoisted.searchUsers).toHaveBeenCalledWith(7, 'pri')
  })

  it('defaults q to an empty string when omitted', async () => {
    const handle = await load()
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)
    hoisted.searchUsers.mockResolvedValueOnce([])

    await handle(getRequest('', 'session=abc'))
    expect(hoisted.searchUsers).toHaveBeenCalledWith(7, '')
  })

  it('returns 401 when there is no session', async () => {
    const handle = await load()
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

    const response = await handle(getRequest('?q=pri', null))
    expect(response.status).toBe(401)
    expect(hoisted.searchUsers).not.toHaveBeenCalled()
  })

  it('maps an unexpected error to 500', async () => {
    const handle = await load()
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(7)
    hoisted.searchUsers.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handle(getRequest('?q=pri', 'session=abc'))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_SEARCHING_USERS',
    })
    errorSpy.mockRestore()
  })
})
