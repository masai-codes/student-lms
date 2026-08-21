import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleGetCalendarEvents } from '../getCalendarEvents.handler'

const hoisted = vi.hoisted(() => ({
  getCalendarEvents: vi.fn(),
  getUserId: vi.fn(),
}))

vi.mock('@/server/api/calendar/getCalendarEvents.service', () => ({
  getCalendarEvents: hoisted.getCalendarEvents,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
}))

const request = (query: string) =>
  new Request(`http://localhost/api/calendar/events${query}`)

describe('handleGetCalendarEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserId.mockResolvedValue(101)
    hoisted.getCalendarEvents.mockResolvedValue({
      range: { start: '2026-08-10', end: '2026-08-16' },
      events: [],
    })
  })

  it('returns events for a valid range', async () => {
    const response = await handleGetCalendarEvents(
      request('?start=2026-08-10&end=2026-08-16'),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      range: { start: '2026-08-10', end: '2026-08-16' },
      events: [],
    })
    expect(hoisted.getCalendarEvents).toHaveBeenCalledWith(
      101,
      { start: '2026-08-10', end: '2026-08-16' },
      null,
    )
  })

  it('forwards a valid batchId', async () => {
    await handleGetCalendarEvents(
      request('?start=2026-08-10&end=2026-08-16&batchId=3'),
    )
    expect(hoisted.getCalendarEvents).toHaveBeenCalledWith(
      101,
      expect.anything(),
      3,
    )
  })

  it('401s without a session', async () => {
    hoisted.getUserId.mockResolvedValue(null)
    const response = await handleGetCalendarEvents(
      request('?start=2026-08-10&end=2026-08-16'),
    )
    expect(response.status).toBe(401)
  })

  it('400s on a malformed range', async () => {
    const response = await handleGetCalendarEvents(request('?start=nope'))
    expect(response.status).toBe(400)
    const body = (await response.json()) as { code: string }
    expect(body.code).toBe('INVALID_CALENDAR_RANGE')
    expect(hoisted.getCalendarEvents).not.toHaveBeenCalled()
  })

  it('400s on a malformed batchId', async () => {
    const response = await handleGetCalendarEvents(
      request('?start=2026-08-10&end=2026-08-16&batchId=abc'),
    )
    expect(response.status).toBe(400)
    const body = (await response.json()) as { code: string }
    expect(body.code).toBe('INVALID_CALENDAR_BATCH')
  })

  it('500s with a stable code when the service throws unexpectedly', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.getCalendarEvents.mockRejectedValue(new Error('boom'))
    const response = await handleGetCalendarEvents(
      request('?start=2026-08-10&end=2026-08-16'),
    )
    expect(response.status).toBe(500)
    const body = (await response.json()) as { code: string }
    expect(body.code).toBe('SERVER_ERROR_FETCHING_CALENDAR_EVENTS')
  })
})
