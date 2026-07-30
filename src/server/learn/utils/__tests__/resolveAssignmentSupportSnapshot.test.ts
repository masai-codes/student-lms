import { describe, expect, it } from 'vitest'

import { resolveAssignmentSupportSnapshot } from '../resolveAssignmentSupportSnapshot'

const emptyFooter = {
  visible: true,
  statusChip: null,
  showPracticeModeChip: false,
  score: null,
  notices: [],
  actions: [],
  meta: { submissionId: null, assessPlatformLink: null, platform: null },
}

describe('resolveAssignmentSupportSnapshot', () => {
  it('maps practice assignment status and hides score policy without weightage', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 1,
      assignmentKind: 'practice',
      phase: 'during',
      progressStatus: 'completed',
      settings: null,
      footer: emptyFooter,
    })

    expect(snapshot.typeLabel).toBe('Practice')
    expect(snapshot.statusLabel).toBe('Submitted')
    expect(snapshot.statusTone).toBe('success')
    expect(snapshot.scoreDisplay).toBeNull()
    expect(snapshot.scorePolicyNotice).toBeNull()
  })

  it('shows Practice Mode instead of Overdue for past-deadline practice assignments', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 6,
      assignmentKind: 'practice',
      phase: 'after',
      progressStatus: 'overdue',
      settings: null,
      footer: emptyFooter,
    })

    expect(snapshot.statusLabel).toBe('Practice Mode')
    expect(snapshot.statusTone).toBe('neutral')
  })

  it('maps graded assignment type and score policy when weightage is set', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 2,
      assignmentKind: 'assignment',
      phase: 'after',
      progressStatus: 'in-progress',
      settings: { weightagePercentage: 69 },
      footer: emptyFooter,
    })

    expect(snapshot.typeLabel).toBe('Graded')
    expect(snapshot.statusLabel).toBe('In progress')
    expect(snapshot.scorePolicyNotice).toBe(
      'Score will be considered for final grading',
    )
    expect(snapshot.weightagePercentage).toBe(69)
  })

  it('hides score policy and weightage when weightagePercentage is missing', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 2,
      assignmentKind: 'assignment',
      phase: 'after',
      progressStatus: 'in-progress',
      settings: { case: 'case1' },
      footer: emptyFooter,
    })

    expect(snapshot.scorePolicyNotice).toBeNull()
    expect(snapshot.weightagePercentage).toBeNull()
  })

  it('maps evaluation attempt and released score', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 3,
      assignmentKind: 'evaluation',
      phase: 'after',
      progressStatus: 'completed',
      settings: { weightagePercentage: 25 },
      footer: {
        ...emptyFooter,
        score: {
          state: 'released',
          score: 8.2,
          label: 'You obtained 8.20/10',
        },
      },
    })

    expect(snapshot.typeLabel).toBeNull()
    expect(snapshot.statusLabel).toBe('Attempted')
    expect(snapshot.scoreDisplay).toBe('8.20/10')
    expect(snapshot.scorePolicyNotice).toBe(
      'Score will be considered for final grading',
    )
    expect(snapshot.weightagePercentage).toBe(25)
  })

  it('maps evaluation pending score', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 4,
      assignmentKind: 'evaluation',
      phase: 'after',
      progressStatus: 'completed',
      settings: null,
      footer: {
        ...emptyFooter,
        score: {
          state: 'pending',
          score: null,
          label: 'Score yet to be released',
        },
      },
    })

    expect(snapshot.scoreDisplay).toBe('Pending')
    expect(snapshot.scorePolicyNotice).toBeNull()
  })

  it('maps evaluation not attempted', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 5,
      assignmentKind: 'evaluation',
      phase: 'during',
      progressStatus: 'new',
      settings: null,
      footer: emptyFooter,
    })

    expect(snapshot.statusLabel).toBe('Not Attempted')
    expect(snapshot.scoreDisplay).toBe('-')
  })
})
