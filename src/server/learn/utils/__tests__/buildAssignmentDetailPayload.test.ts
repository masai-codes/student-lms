import { describe, expect, it } from 'vitest'

import { buildAssignmentDetailPayload } from '../buildAssignmentDetailPayload'
import type { LearnHubDetailPayload } from '@/server/learn/types'

const core: LearnHubDetailPayload = {
  id: 42,
  title: 'Arrays Practice',
  hostName: 'Ravi',
  displayDate: '20 May, 10:00 AM',
  priority: 'mandatory',
  tags: ['practice', 'coding', 'Week 1'],
  discussions: [],
}

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('buildAssignmentDetailPayload', () => {
  it('builds practice assignment in during phase', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'practice',
        category: 'coding',
        platform: 'Assessment Platform',
        showScores: 1,
        showSubmission: 0,
        settings: { case: 'case2' },
        schedule,
        concludes,
        hostAvatarUrl: '/avatar.png',
        instructions: '  Solve all problems  ',
        enforceDeadline: 1,
      },
      scheduleMs + 60_000,
      { submission: null },
      [],
      [],
    )

    expect(payload.assignmentKind).toBe('practice')
    expect(payload.phase).toBe('during')
    expect(payload.instructions).toBe('Solve all problems')
    expect(payload.enforceDeadline).toBe(true)
    expect(payload.hostAvatarUrl).toBe('/avatar.png')
    expect(payload.scheduleDisplayRange).toContain('2026')
    expect(payload.phaseContent.title).toContain('open')
    expect(payload.footer.visible).toBe(true)
    expect(payload.completedDetails).toBeNull()
  })

  it('includes a completed-details banner when the submission is completed', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'assignment',
        category: 'coding',
        platform: null,
        showScores: 0,
        showSubmission: 0,
        settings: null,
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 0,
      },
      scheduleMs + 60_000,
      {
        submission: {
          id: 7,
          completed: true,
          status: 'submitted',
          markAsCompleted: null,
          score: 0,
          startedAt: null,
          completedAt: '2026-05-20T11:30:00.000Z',
          data: null,
        },
      },
      [],
      [],
    )

    expect(payload.completedDetails?.variant).toBe('auto-graded')
    expect(payload.liveAnalytics).toBeNull()
  })

  it('suppresses the completed-details banner when the assignment has problems', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'assignment',
        category: 'coding',
        platform: null,
        showScores: 0,
        showSubmission: 0,
        settings: null,
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 0,
      },
      scheduleMs + 60_000,
      {
        submission: {
          id: 7,
          completed: true,
          status: 'submitted',
          markAsCompleted: null,
          score: 0,
          startedAt: null,
          completedAt: '2026-05-20T11:30:00.000Z',
          data: null,
        },
      },
      [],
      [
        {
          elementId: 1,
          problemId: 11,
          title: 'Two Sum',
          statusChip: { tone: 'completed', label: 'Completed' },
        },
      ],
    )

    expect(payload.completedDetails).toBeNull()
  })

  it('includes live analytics for a launched assessment-platform assignment', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'assignment',
        category: 'coding',
        platform: 'Assessment Platform',
        showScores: 1,
        showSubmission: 1,
        settings: { liveProgress: true },
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 0,
      },
      scheduleMs + 60_000,
      {
        submission: {
          id: 9,
          completed: false,
          status: 'pending',
          markAsCompleted: null,
          score: 0,
          startedAt: null,
          completedAt: null,
          data: {
            assess_platform_link_clicked: true,
            totalQuestions: 10,
            totalAttempted: 4,
            gradedQuestions: 3,
            correctAnswers: 2,
            wrongAnswers: 1,
          },
        },
      },
      [],
      [],
    )

    expect(payload.liveAnalytics).toEqual({
      totalQuestions: 10,
      attempted: 4,
      notGraded: 1,
      correct: 2,
      wrong: 1,
    })
  })

  it('builds evaluation assignment in after phase', () => {
    const concludesMs = new Date(concludes).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'evaluation',
        category: 'module',
        platform: null,
        showScores: 0,
        showSubmission: 0,
        settings: null,
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 0,
      },
      concludesMs + 60_000,
      { submission: null },
      [],
      [],
    )

    expect(payload.assignmentKind).toBe('evaluation')
    expect(payload.phase).toBe('after')
    expect(payload.enforceDeadline).toBe(false)
    expect(payload.headerBadges).toEqual([])
    // unlocked evaluation with no submission → pledge required
    expect(payload.requiresPledge).toBe(true)
  })

  it('exposes deadline-enforced and weightage header badges', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'evaluation',
        category: 'module',
        platform: null,
        showScores: 0,
        showSubmission: 0,
        settings: { weightagePercentage: 20 },
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 1,
      },
      scheduleMs + 60_000,
      { submission: null },
      [],
      [],
    )

    expect(payload.headerBadges).toEqual([
      { kind: 'deadline-enforced', label: 'Deadline Enforced' },
      { kind: 'weightage', label: '20% Weightage' },
    ])
  })

  it('passes problems through and hides the footer when problems exist', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'assignment',
        category: 'coding',
        platform: null,
        showScores: 0,
        showSubmission: 0,
        settings: null,
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 0,
      },
      scheduleMs + 60_000,
      { submission: null },
      [],
      [
        {
          elementId: 1,
          problemId: 11,
          title: 'Two Sum',
          statusChip: { tone: 'completed', label: 'Completed' },
        },
      ],
    )

    expect(payload.problems).toHaveLength(1)
    expect(payload.footer.visible).toBe(false)
  })

  it('throws for unsupported assignment types', () => {
    expect(() =>
      buildAssignmentDetailPayload(
        core,
        {
          type: 'quiz',
          category: 'other',
          platform: null,
          showScores: 0,
          showSubmission: 0,
          settings: null,
          schedule,
          concludes,
          hostAvatarUrl: null,
          instructions: null,
          enforceDeadline: 0,
        },
        Date.now(),
        { submission: null },
        [],
        [],
      ),
    ).toThrow('ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE')
  })
})
