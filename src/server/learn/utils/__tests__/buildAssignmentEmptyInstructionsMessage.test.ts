import { describe, expect, it } from 'vitest'

import { buildAssignmentEmptyInstructionsMessage } from '../buildAssignmentEmptyInstructionsMessage'

describe('buildAssignmentEmptyInstructionsMessage', () => {
  it('adds "You can start … below." on an open Assessment Platform item', () => {
    const message = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'assignment',
      platform: 'Assessment Platform',
      isExpired: false,
      submission: null,
    })

    expect(message).toBe(
      'This Assignment does not require additional instructions. You can start the Assignment below.',
    )
  })

  it('drops the "start below" hint once expired', () => {
    const message = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'assignment',
      platform: 'Assessment Platform',
      isExpired: true,
      submission: null,
    })

    expect(message).toBe('This Assignment does not require additional instructions.')
  })

  it('drops the "start below" hint once completed', () => {
    const message = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'assignment',
      platform: 'Assessment Platform',
      isExpired: false,
      submission: { completed: true, data: null },
    })

    expect(message).toBe('This Assignment does not require additional instructions.')
  })

  it('drops the "start below" hint once a link is already generated', () => {
    const message = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'assignment',
      platform: 'Assessment Platform',
      isExpired: false,
      submission: {
        completed: false,
        data: { assess_platform_link: 'https://assess.example/x' },
      },
    })

    expect(message).toBe('This Assignment does not require additional instructions.')
  })

  it('never shows the "start below" hint off the Assessment Platform', () => {
    const message = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'assignment',
      platform: 'Github',
      isExpired: false,
      submission: null,
    })

    expect(message).toBe('This Assignment does not require additional instructions.')
  })

  it('uses the right noun per kind', () => {
    const practice = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'practice',
      platform: null,
      isExpired: false,
      submission: null,
    })
    const evaluation = buildAssignmentEmptyInstructionsMessage({
      assignmentKind: 'evaluation',
      platform: null,
      isExpired: false,
      submission: null,
    })

    expect(practice).toBe(
      'This Practice Assignment does not require additional instructions.',
    )
    expect(evaluation).toBe(
      'This Evaluation does not require additional instructions.',
    )
  })
})
