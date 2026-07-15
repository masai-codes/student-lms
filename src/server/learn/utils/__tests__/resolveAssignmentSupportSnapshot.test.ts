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
  it('maps practice assignment status and type', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 1,
      assignmentKind: 'practice',
      phase: 'during',
      progressStatus: 'completed',
      footer: emptyFooter,
    })

    expect(snapshot.typeLabel).toBe('Practice')
    expect(snapshot.statusLabel).toBe('Submitted')
    expect(snapshot.statusTone).toBe('success')
    expect(snapshot.scoreDisplay).toBeNull()
    expect(snapshot.scorePolicyNotice).toBe(
      'Score will not be considered for final grading',
    )
  })

  it('maps graded assignment type', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 2,
      assignmentKind: 'assignment',
      phase: 'after',
      progressStatus: 'in-progress',
      footer: emptyFooter,
    })

    expect(snapshot.typeLabel).toBe('Graded')
    expect(snapshot.statusLabel).toBe('In progress')
    expect(snapshot.scorePolicyNotice).toBe(
      'Score will be considered for final grading',
    )
  })

  it('maps evaluation attempt and released score', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 3,
      assignmentKind: 'evaluation',
      phase: 'after',
      progressStatus: 'completed',
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
  })

  it('maps evaluation pending score', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 4,
      assignmentKind: 'evaluation',
      phase: 'after',
      progressStatus: 'completed',
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
  })

  it('maps evaluation not attempted', () => {
    const snapshot = resolveAssignmentSupportSnapshot({
      assignmentId: 5,
      assignmentKind: 'evaluation',
      phase: 'during',
      progressStatus: 'new',
      footer: emptyFooter,
    })

    expect(snapshot.statusLabel).toBe('Not Attempted')
    expect(snapshot.scoreDisplay).toBe('-')
  })
})
