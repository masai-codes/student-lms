import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleGetCalendarFeed } from '../getCalendarFeed.handler'

const hoisted = vi.hoisted(() => ({
  findUserId: vi.fn(),
  getEvents: vi.fn(),
}))

vi.mock('@/server/api/calendar/getCalendarSubscription.service', () => ({
  findUserIdByCalendarToken: hoisted.findUserId,
}))
vi.mock('@/server/api/calendar/getCalendarEvents.service', () => ({
  getCalendarEvents: hoisted.getEvents,
}))

const TOKEN = 'a'.repeat(32)
const request = (origin = 'https://demo.example.com') =>
  new Request(`${origin}/api/calendar/feed/${TOKEN}.ics`)

const event = {
  id: 7,
  type: 'lecture' as const,
  title: 'DSA Session',
  schedule: '2026-08-14T10:00:00+05:30',
  concludes: '2026-08-14T12:00:00+05:30',
  effectiveEnd: '2026-08-14T12:00:00+05:30',
  optional: false,
  sectionId: 5,
  sectionName: null,
  batchName: null,
  hostName: null,
  detailPath: '/lectures/7',
  joinLive: null,
}

describe('handleGetCalendarFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.APP_PUBLIC_ORIGIN
    hoisted.findUserId.mockResolvedValue(101)
    hoisted.getEvents.mockResolvedValue({ events: [event] })
  })
  afterEach(() => {
    delete process.env.APP_PUBLIC_ORIGIN
  })

  it('serves an ICS body with calendar content headers', async () => {
    const response = await handleGetCalendarFeed(`${TOKEN}.ics`, request())
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/calendar')
    const body = await response.text()
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('UID:lecture-7@masai-student-lms')
  })

  it('deep-links events at the requesting host, not production', async () => {
    const body = await (
      await handleGetCalendarFeed(TOKEN, request('https://demo.example.com'))
    ).text()
    expect(body).toContain('URL:https://demo.example.com/lectures/7')
    expect(body).not.toContain('students.masaischool.com')
  })

  it('prefers APP_PUBLIC_ORIGIN when the public host differs from the proxy view', async () => {
    process.env.APP_PUBLIC_ORIGIN = 'https://students.masaischool.com/'
    const body = await (
      await handleGetCalendarFeed(TOKEN, request('http://10.0.0.5:3000'))
    ).text()
    expect(body).toContain('URL:https://students.masaischool.com/lectures/7')
  })

  it('falls back to the default host when there is no request', async () => {
    const body = await (await handleGetCalendarFeed(TOKEN)).text()
    expect(body).toContain('URL:https://students.masaischool.com/lectures/7')
  })

  it('strips the .ics suffix before resolving the token', async () => {
    await handleGetCalendarFeed(`${TOKEN}.ics`, request())
    expect(hoisted.findUserId).toHaveBeenCalledWith(TOKEN)
  })

  it('404s for an unknown token without leaking detail', async () => {
    hoisted.findUserId.mockResolvedValue(null)
    const response = await handleGetCalendarFeed('nope', request())
    expect(response.status).toBe(404)
    expect(hoisted.getEvents).not.toHaveBeenCalled()
  })

  it('500s when the event service throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    hoisted.getEvents.mockRejectedValue(new Error('boom'))
    const response = await handleGetCalendarFeed(TOKEN, request())
    expect(response.status).toBe(500)
  })
})
