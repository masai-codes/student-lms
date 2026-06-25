import { describe, expect, it } from 'vitest'

import { resolveLectureFeedbackWindow } from '../resolveLectureFeedbackWindow'

const SCHEDULE = '2026-05-08T10:00:00.000Z'
const CONCLUDES = '2026-05-08T11:00:00.000Z'
const scheduleMs = new Date(SCHEDULE).getTime()
const concludesMs = new Date(CONCLUDES).getTime()
const MIN = 60 * 1000
const HOUR = 60 * MIN

describe('resolveLectureFeedbackWindow', () => {
  it('is closed when show_feedback is off', () => {
    expect(
      resolveLectureFeedbackWindow({
        schedule: SCHEDULE,
        concludes: CONCLUDES,
        nowMs: scheduleMs + 30 * MIN,
        showFeedback: false,
      }),
    ).toBe(false)
  })

  it('is closed before schedule + 15 minutes', () => {
    expect(
      resolveLectureFeedbackWindow({
        schedule: SCHEDULE,
        concludes: CONCLUDES,
        nowMs: scheduleMs + 14 * MIN,
        showFeedback: true,
      }),
    ).toBe(false)
  })

  it('is open between schedule + 15 minutes and concludes + 24 hours', () => {
    expect(
      resolveLectureFeedbackWindow({
        schedule: SCHEDULE,
        concludes: CONCLUDES,
        nowMs: scheduleMs + 16 * MIN,
        showFeedback: true,
      }),
    ).toBe(true)
  })

  it('is closed after concludes + 24 hours', () => {
    expect(
      resolveLectureFeedbackWindow({
        schedule: SCHEDULE,
        concludes: CONCLUDES,
        nowMs: concludesMs + 24 * HOUR + MIN,
        showFeedback: true,
      }),
    ).toBe(false)
  })

  it('falls back to schedule + 24 hours when concludes is missing', () => {
    expect(
      resolveLectureFeedbackWindow({
        schedule: SCHEDULE,
        concludes: null,
        nowMs: scheduleMs + 23 * HOUR,
        showFeedback: true,
      }),
    ).toBe(true)
  })

  it('is closed when schedule is missing', () => {
    expect(
      resolveLectureFeedbackWindow({
        schedule: null,
        concludes: CONCLUDES,
        nowMs: scheduleMs + 30 * MIN,
        showFeedback: true,
      }),
    ).toBe(false)
  })
})
