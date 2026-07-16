import { describe, expect, it } from 'vitest'

import { resolveAssignmentPhase } from '../resolveAssignmentPhase'

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('resolveAssignmentPhase', () => {
  it('returns before when before schedule', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveAssignmentPhase({
        schedule,
        concludes,
        nowMs: scheduleMs - 60_000,
      }),
    ).toBe('before')
  })

  it('returns during between schedule and concludes', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveAssignmentPhase({
        schedule,
        concludes,
        nowMs: scheduleMs + 60_000,
      }),
    ).toBe('during')
  })

  it('returns after when past concludes', () => {
    const concludesMs = new Date(concludes).getTime()
    expect(
      resolveAssignmentPhase({
        schedule,
        concludes,
        nowMs: concludesMs + 60_000,
      }),
    ).toBe('after')
  })

  it('returns during when schedule is missing', () => {
    expect(
      resolveAssignmentPhase({
        schedule: null,
        concludes,
        nowMs: Date.now(),
      }),
    ).toBe('during')
  })

  it('returns during after schedule when concludes is missing', () => {
    const scheduleMs = new Date(schedule).getTime()
    expect(
      resolveAssignmentPhase({
        schedule,
        concludes: null,
        nowMs: scheduleMs + 60_000,
      }),
    ).toBe('during')
  })
})
