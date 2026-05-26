import { describe, expect, it } from 'vitest'

import { scrubZoomLinkForSchedule } from '../scrubZoomLinkForSchedule'

const schedule = '2026-05-20T10:00:00.000Z'

describe('scrubZoomLinkForSchedule', () => {
  it('hides link until shortly before start', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      scrubZoomLinkForSchedule({
        zoomLink: 'https://zoom.example/j/1',
        schedule,
        nowMs: scheduleMs - 11 * 60 * 1000,
      }),
    ).toBeNull()
  })

  it('reveals link inside the window', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      scrubZoomLinkForSchedule({
        zoomLink: 'https://zoom.example/j/1',
        schedule,
        nowMs: scheduleMs - 5 * 60 * 1000,
      }),
    ).toBe('https://zoom.example/j/1')
  })

  it('returns null for empty link', () => {
    expect(
      scrubZoomLinkForSchedule({
        zoomLink: '  ',
        schedule,
        nowMs: Date.now(),
      }),
    ).toBeNull()
  })
})
