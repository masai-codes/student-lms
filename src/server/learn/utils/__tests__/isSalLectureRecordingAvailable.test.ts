import { describe, expect, it } from 'vitest'

import { isSalLectureRecordingAvailable } from '../isSalLectureRecordingAvailable'

const adaptiveLink =
  'https://experience-api.masaischool.com/api/adaptive-lecture/abc123/join'
const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('isSalLectureRecordingAvailable', () => {
  it('returns false for non-adaptive links', () => {
    expect(
      isSalLectureRecordingAvailable({
        zoomLink: 'https://zoom.example/j/1',
        schedule,
        concludes,
        nowMs: new Date(concludes).getTime() + 60 * 60 * 1000,
      }),
    ).toBe(false)
  })

  it('returns false before concludes + 30 min', () => {
    const concludesMs = new Date(concludes).getTime()
    expect(
      isSalLectureRecordingAvailable({
        zoomLink: adaptiveLink,
        schedule,
        concludes,
        nowMs: concludesMs + 29 * 60 * 1000,
      }),
    ).toBe(false)
  })

  it('returns true once past concludes + 30 min', () => {
    const concludesMs = new Date(concludes).getTime()
    expect(
      isSalLectureRecordingAvailable({
        zoomLink: adaptiveLink,
        schedule,
        concludes,
        nowMs: concludesMs + 31 * 60 * 1000,
      }),
    ).toBe(true)
  })

  it('falls back to schedule when concludes is missing', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      isSalLectureRecordingAvailable({
        zoomLink: adaptiveLink,
        schedule,
        concludes: null,
        nowMs: scheduleMs + 31 * 60 * 1000,
      }),
    ).toBe(true)
  })
})
