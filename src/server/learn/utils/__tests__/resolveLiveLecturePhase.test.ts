import { describe, expect, it } from 'vitest'

import { resolveLiveLecturePhase } from '../resolveLiveLecturePhase'

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('resolveLiveLecturePhase', () => {
  it('returns before when far from start', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveLiveLecturePhase({
        schedule,
        concludes,
        nowMs: scheduleMs - 11 * 60 * 1000,
      }),
    ).toBe('before')
  })

  it('returns during in the visible window', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveLiveLecturePhase({
        schedule,
        concludes,
        nowMs: scheduleMs - 5 * 60 * 1000,
      }),
    ).toBe('during')
  })

  it('returns after when past concludes', () => {
    const concludesMs = new Date(concludes).getTime()
    expect(
      resolveLiveLecturePhase({
        schedule,
        concludes,
        nowMs: concludesMs + 60_000,
      }),
    ).toBe('after')
  })

  it('returns before when schedule is missing', () => {
    expect(
      resolveLiveLecturePhase({
        schedule: null,
        concludes,
        nowMs: Date.now(),
      }),
    ).toBe('before')
  })
})
