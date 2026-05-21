import { describe, expect, it } from 'vitest'

import { resolveVideoLecturePhase } from '../resolveVideoLecturePhase'

const schedule = '2026-05-20T10:00:00.000Z'

describe('resolveVideoLecturePhase', () => {
  it('returns before until the visibility window', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveVideoLecturePhase({
        schedule,
        nowMs: scheduleMs - 11 * 60 * 1000,
      }),
    ).toBe('before')
  })

  it('returns during_after inside the visibility window', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveVideoLecturePhase({
        schedule,
        nowMs: scheduleMs - 5 * 60 * 1000,
      }),
    ).toBe('during_after')
  })

  it('returns during_after when schedule is missing', () => {
    expect(
      resolveVideoLecturePhase({
        schedule: null,
        nowMs: Date.now(),
      }),
    ).toBe('during_after')
  })
})
