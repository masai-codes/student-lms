import { describe, expect, it } from 'vitest'

import { buildAssignmentCompletedDetails } from '../buildAssignmentCompletedDetails'

const concludes = '2026-05-20T12:00:00.000Z'

describe('buildAssignmentCompletedDetails', () => {
  it('returns null when there is no submission', () => {
    expect(
      buildAssignmentCompletedDetails({ submission: null, concludes }),
    ).toBeNull()
  })

  it('returns null when a submission exists but is neither completed nor marked', () => {
    expect(
      buildAssignmentCompletedDetails({
        submission: { completed: false, completedAt: null, data: null },
        concludes,
      }),
    ).toBeNull()
  })

  it('builds an auto-graded banner using the completion timestamp', () => {
    const result = buildAssignmentCompletedDetails({
      submission: {
        completed: true,
        completedAt: '2026-05-20T11:30:00.000Z',
        data: null,
      },
      concludes,
    })

    expect(result?.variant).toBe('auto-graded')
    expect(result?.message).toContain('automatically marked as "Completed"')
    expect(result?.message).toContain('and graded.')
    expect(result?.message).toContain(result?.completedAtLabel ?? '')
  })

  it('clamps the auto-graded timestamp to the deadline when completed later', () => {
    const clamped = buildAssignmentCompletedDetails({
      submission: {
        completed: true,
        completedAt: '2026-05-20T18:00:00.000Z',
        data: null,
      },
      concludes,
    })
    const atDeadline = buildAssignmentCompletedDetails({
      submission: { completed: true, completedAt: concludes, data: null },
      concludes,
    })

    expect(clamped?.completedAtLabel).toBe(atDeadline?.completedAtLabel)
  })

  it('does not clamp when there is no deadline', () => {
    const result = buildAssignmentCompletedDetails({
      submission: {
        completed: true,
        completedAt: '2026-05-20T18:00:00.000Z',
        data: null,
      },
      concludes: null,
    })

    expect(result?.variant).toBe('auto-graded')
  })

  it('ignores a completed flag without a completion timestamp', () => {
    expect(
      buildAssignmentCompletedDetails({
        submission: { completed: true, completedAt: null, data: null },
        concludes,
      }),
    ).toBeNull()
  })

  it('builds a manual banner from data.marked_completed_at', () => {
    const result = buildAssignmentCompletedDetails({
      submission: {
        completed: false,
        completedAt: null,
        data: { marked_completed_at: '2026-05-19T09:00:00.000Z' },
      },
      concludes,
    })

    expect(result?.variant).toBe('manual')
    expect(result?.message).toContain('You have marked this assignment')
  })

  it('ignores a non-string marked_completed_at value', () => {
    expect(
      buildAssignmentCompletedDetails({
        submission: {
          completed: false,
          completedAt: null,
          data: { marked_completed_at: 123 },
        },
        concludes,
      }),
    ).toBeNull()
  })
})
