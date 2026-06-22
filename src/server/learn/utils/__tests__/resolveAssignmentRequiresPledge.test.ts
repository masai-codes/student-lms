import { describe, expect, it } from 'vitest'

import { resolveAssignmentRequiresPledge } from '../resolveAssignmentRequiresPledge'

const schedule = '2026-05-20T10:00:00.000Z'
const unlockedMs = new Date(schedule).getTime() + 60_000
const lockedMs = new Date(schedule).getTime() - 60_000

describe('resolveAssignmentRequiresPledge', () => {
  it('requires a pledge for an unlocked evaluation with no submission', () => {
    expect(
      resolveAssignmentRequiresPledge({
        assignmentKind: 'evaluation',
        schedule,
        nowMs: unlockedMs,
        hasSubmission: false,
      }),
    ).toBe(true)
  })

  it('does not require a pledge for non-evaluation assignments', () => {
    for (const assignmentKind of ['assignment', 'practice'] as const) {
      expect(
        resolveAssignmentRequiresPledge({
          assignmentKind,
          schedule,
          nowMs: unlockedMs,
          hasSubmission: false,
        }),
      ).toBe(false)
    }
  })

  it('does not require a pledge once a submission exists', () => {
    expect(
      resolveAssignmentRequiresPledge({
        assignmentKind: 'evaluation',
        schedule,
        nowMs: unlockedMs,
        hasSubmission: true,
      }),
    ).toBe(false)
  })

  it('does not require a pledge before the window opens', () => {
    expect(
      resolveAssignmentRequiresPledge({
        assignmentKind: 'evaluation',
        schedule,
        nowMs: lockedMs,
        hasSubmission: false,
      }),
    ).toBe(false)
  })

  it('treats a missing or invalid schedule as unlocked', () => {
    for (const value of [null, '', 'not-a-date']) {
      expect(
        resolveAssignmentRequiresPledge({
          assignmentKind: 'evaluation',
          schedule: value,
          nowMs: unlockedMs,
          hasSubmission: false,
        }),
      ).toBe(true)
    }
  })
})
