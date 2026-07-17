import { describe, expect, it } from 'vitest'

import { calculateAssignmentProgressStatus } from '../calculateAssignmentProgressStatus'

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('calculateAssignmentProgressStatus', () => {
  it('returns new before schedule', () => {
    expect(
      calculateAssignmentProgressStatus({
        schedule,
        concludes,
        nowMs: new Date(schedule).getTime() - 60_000,
        submission: null,
      }),
    ).toBe('new')
  })

  it('returns in-progress when submission exists during window', () => {
    expect(
      calculateAssignmentProgressStatus({
        schedule,
        concludes,
        nowMs: new Date(schedule).getTime() + 60_000,
        submission: {
          completed: false,
          status: 'pending',
          markAsCompleted: null,
        },
      }),
    ).toBe('in-progress')
  })

  it('returns completed when submission is completed', () => {
    expect(
      calculateAssignmentProgressStatus({
        schedule,
        concludes,
        nowMs: new Date(schedule).getTime() + 60_000,
        submission: {
          completed: true,
          status: 'pending',
          markAsCompleted: null,
        },
      }),
    ).toBe('completed')
  })

  it('returns overdue after concludes with pending submission', () => {
    expect(
      calculateAssignmentProgressStatus({
        schedule,
        concludes,
        nowMs: new Date(concludes).getTime() + 60_000,
        submission: {
          completed: false,
          status: 'pending',
          markAsCompleted: null,
        },
      }),
    ).toBe('overdue')
  })
})
