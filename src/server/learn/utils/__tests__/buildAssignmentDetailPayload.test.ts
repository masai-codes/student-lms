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
        schedule,
        concludes,
        hostAvatarUrl: '/avatar.png',
        instructions: '  Solve all problems  ',
        enforceDeadline: 1,
      },
      scheduleMs + 60_000,
    )

    expect(payload.assignmentKind).toBe('practice')
    expect(payload.phase).toBe('during')
    expect(payload.instructions).toBe('Solve all problems')
    expect(payload.enforceDeadline).toBe(true)
    expect(payload.hostAvatarUrl).toBe('/avatar.png')
    expect(payload.scheduleDisplayRange).toContain('2026')
  })

  it('builds evaluation assignment in after phase', () => {
    const concludesMs = new Date(concludes).getTime()
    const payload = buildAssignmentDetailPayload(
      core,
      {
        type: 'evaluation',
        schedule,
        concludes,
        hostAvatarUrl: null,
        instructions: null,
        enforceDeadline: 0,
      },
      concludesMs + 60_000,
    )

    expect(payload.assignmentKind).toBe('evaluation')
    expect(payload.phase).toBe('after')
    expect(payload.enforceDeadline).toBe(false)
  })

  it('throws for unsupported assignment types', () => {
    expect(() =>
      buildAssignmentDetailPayload(
        core,
        {
          type: 'quiz',
          schedule,
          concludes,
          hostAvatarUrl: null,
          instructions: null,
          enforceDeadline: 0,
        },
        Date.now(),
      ),
    ).toThrow('ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE')
  })
})
