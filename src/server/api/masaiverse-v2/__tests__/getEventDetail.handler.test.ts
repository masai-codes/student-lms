import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  getEventDetail: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getEventDetail.service', () => ({
  getEventDetail: hoisted.getEventDetail,
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: vi.fn().mockResolvedValue(false),
}))

function getRequest(eventId: string, cookie: string | null): Request {
  return new Request(
    `http://localhost/api/masaiverse-v2/events/detail?eventId=${eventId}`,
    { headers: cookie ? { cookie } : {} },
  )
}

const PAYLOAD = { id: '7', title: 'Build Sprint' }

describe('handleGetEventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the event detail for the requested id', async () => {
    const { handleGetEventDetail } =
      await import('../handlers/getEventDetail.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(1)
    hoisted.getEventDetail.mockResolvedValueOnce(PAYLOAD)

    const response = await handleGetEventDetail(getRequest('7', 'session=abc'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(PAYLOAD)
    expect(hoisted.getEventDetail).toHaveBeenCalledWith(7, 1, undefined, false)
  })

  it('returns 404 when the event is missing', async () => {
    const { handleGetEventDetail } =
      await import('../handlers/getEventDetail.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(1)
    hoisted.getEventDetail.mockResolvedValueOnce(null)

    const response = await handleGetEventDetail(getRequest('99', 'session=abc'))

    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toEqual({
      code: 'EVENT_NOT_FOUND',
      message: 'EVENT_NOT_FOUND',
    })
  })

  it('returns 401 when there is no session user', async () => {
    const { handleGetEventDetail } =
      await import('../handlers/getEventDetail.handler')
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleGetEventDetail(getRequest('7', null))

    expect(response.status).toBe(401)
    expect(hoisted.getEventDetail).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleGetEventDetail } =
      await import('../handlers/getEventDetail.handler')
    vi.mocked(requireSessionUserId).mockResolvedValueOnce(1)
    hoisted.getEventDetail.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetEventDetail(getRequest('7', 'session=abc'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_FETCHING_EVENT_DETAIL',
      message: 'SERVER_ERROR_FETCHING_EVENT_DETAIL',
    })
    consoleSpy.mockRestore()
  })
})
