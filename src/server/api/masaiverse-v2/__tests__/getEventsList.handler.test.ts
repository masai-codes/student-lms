import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getEventsList: vi.fn(),
  getCurrentUserId: vi.fn(),
}))

vi.mock('@/server/api/masaiverse-v2/services/getEventsList.service', () => ({
  getEventsList: hoisted.getEventsList,
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getCurrentUserId,
}))

vi.mock('@/server/api/masaiverse-v2/services/publishVisibility', () => ({
  canSeeUnpublished: vi.fn().mockResolvedValue(false),
}))

describe('handleGetEventsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps the events list under an `events` key', async () => {
    const { handleGetEventsList } =
      await import('../handlers/getEventsList.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(1)
    hoisted.getEventsList.mockResolvedValueOnce([{ id: '1', title: 'Demo' }])

    const response = await handleGetEventsList()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      events: [{ id: '1', title: 'Demo' }],
    })
    // The session user is forwarded so the service can flag enrollments.
    expect(hoisted.getEventsList).toHaveBeenCalledWith(1, false)
  })

  it('returns 401 when there is no session user', async () => {
    const { handleGetEventsList } =
      await import('../handlers/getEventsList.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(null)

    const response = await handleGetEventsList()

    expect(response.status).toBe(401)
    expect(hoisted.getEventsList).not.toHaveBeenCalled()
  })

  it('maps unexpected service failures to a 500 error', async () => {
    const { handleGetEventsList } =
      await import('../handlers/getEventsList.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(1)
    hoisted.getEventsList.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await handleGetEventsList()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: 'SERVER_ERROR_FETCHING_EVENTS_LIST',
      message: 'SERVER_ERROR_FETCHING_EVENTS_LIST',
    })
    consoleSpy.mockRestore()
  })
})
