import { describe, expect, it } from 'vitest'

import { buildAssignmentDetailFooter } from '../buildAssignmentDetailFooter'

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('buildAssignmentDetailFooter', () => {
  it('shows start assessment CTA for unlocked assessment platform assignment', () => {
    const duringMs = new Date(schedule).getTime() + 60_000
    const footer = buildAssignmentDetailFooter({
      assignmentKind: 'assignment',
      category: 'coding',
      platform: 'Assessment Platform',
      showScores: true,
      showSubmission: true,
      settings: { case: 'case2' },
      schedule,
      concludes,
      nowMs: duringMs,
      problemCount: 0,
      submission: null,
    })

    expect(footer.visible).toBe(true)
    expect(footer.meta.submissionId).toBeNull()
    expect(footer.actions).toEqual([
      expect.objectContaining({
        kind: 'start-assessment',
        label: 'Start Assignment',
        enabled: true,
      }),
    ])
    expect(footer.statusChip).toBeNull()
  })

  it('shows practice mode chip instead of overdue status for practice assignments', () => {
    const afterMs = new Date(concludes).getTime() + 60_000
    const footer = buildAssignmentDetailFooter({
      assignmentKind: 'practice',
      category: 'coding',
      platform: 'Assessment Platform',
      showScores: false,
      showSubmission: false,
      settings: { case: 'case2' },
      schedule,
      concludes,
      nowMs: afterMs,
      problemCount: 0,
      submission: {
        id: 1,
        completed: false,
        status: 'pending',
        markAsCompleted: null,
        score: 0,
        startedAt: null,
        completedAt: null,
        data: null,
      },
    })

    expect(footer.showPracticeModeChip).toBe(true)
    expect(footer.statusChip).toBeNull()
    expect(footer.notices.some((n) => n.variant === 'score-policy')).toBe(true)
    expect(footer.actions.some((a) => a.kind === 'practice-assessment')).toBe(
      true,
    )
  })

  it('hides footer actions when assignment has problems', () => {
    const footer = buildAssignmentDetailFooter({
      assignmentKind: 'assignment',
      category: 'coding',
      platform: null,
      showScores: false,
      showSubmission: false,
      settings: null,
      schedule,
      concludes,
      nowMs: new Date(schedule).getTime() + 60_000,
      problemCount: 3,
      submission: null,
    })

    expect(footer.visible).toBe(false)
    expect(footer.actions).toEqual([])
  })

  it('uses evaluation CTA labels for evaluation assignments', () => {
    const duringMs = new Date(schedule).getTime() + 60_000
    const footer = buildAssignmentDetailFooter({
      assignmentKind: 'evaluation',
      category: 'module',
      platform: 'Assessment Platform',
      showScores: false,
      showSubmission: false,
      settings: { case: 'case2' },
      schedule,
      concludes,
      nowMs: duringMs,
      problemCount: 0,
      submission: null,
    })

    expect(footer.actions[0]?.label).toBe('Start Evaluation')
  })

  it('shows score policy notice for graded evaluation without problems', () => {
    const footer = buildAssignmentDetailFooter({
      assignmentKind: 'evaluation',
      category: 'graded-evaluation',
      platform: 'Assessment Platform',
      showScores: false,
      showSubmission: false,
      settings: null,
      schedule,
      concludes,
      nowMs: new Date(schedule).getTime() + 60_000,
      problemCount: 0,
      submission: null,
    })

    expect(
      footer.notices.find((n) => n.variant === 'score-policy')?.message,
    ).toBe('Evaluation Score will be considered')
  })

  it('hides score policy notice for evaluation outside the graded category', () => {
    const footer = buildAssignmentDetailFooter({
      assignmentKind: 'evaluation',
      category: 'module',
      platform: 'Assessment Platform',
      showScores: false,
      showSubmission: false,
      settings: null,
      schedule,
      concludes,
      nowMs: new Date(schedule).getTime() + 60_000,
      problemCount: 0,
      submission: null,
    })

    expect(footer.notices.find((n) => n.variant === 'score-policy')).toBe(
      undefined,
    )
  })
})
