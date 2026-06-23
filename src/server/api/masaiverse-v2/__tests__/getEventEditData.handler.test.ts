import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  getEventEditData: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getEventEditData.service', () => ({
  getEventEditData: hoisted.getEventEditData,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function getRequest(eventId: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/events/edit-data?eventId=${eventId}`,
    { headers: cookie ? { cookie } : {} },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleGetEventEditData', () => {
  it('returns the edit data for the session admin', async () => {
    const { handleGetEventEditData } =
      await import('../handlers/getEventEditData.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.getEventEditData.mockResolvedValueOnce({
      id: '5',
      columns: {},
      meta: {},
    })

    const response = await handleGetEventEditData(
      getRequest('5', 'session=abc'),
    )
    expect(response.status).toBe(200)
    expect(hoisted.getEventEditData).toHaveBeenCalledWith(9, 5)
  })

  it('returns 401 without a session', async () => {
    const { handleGetEventEditData } =
      await import('../handlers/getEventEditData.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)
    const response = await handleGetEventEditData(getRequest('5', null))
    expect(response.status).toBe(401)
    expect(hoisted.getEventEditData).not.toHaveBeenCalled()
  })

  it('propagates a 403 from the service', async () => {
    const { handleGetEventEditData } =
      await import('../handlers/getEventEditData.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.getEventEditData.mockRejectedValueOnce(
      new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN'),
    )
    const response = await handleGetEventEditData(
      getRequest('5', 'session=abc'),
    )
    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('403')
  })

  it('maps unexpected failures to a 500 error', async () => {
    const { handleGetEventEditData } =
      await import('../handlers/getEventEditData.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.getEventEditData.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleGetEventEditData(
      getRequest('5', 'session=abc'),
    )
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_EVENT_EDIT_DATA',
    })
    consoleSpy.mockRestore()
  })
})
