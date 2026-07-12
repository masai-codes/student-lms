import { describe, expect, it } from 'vitest'

import {
  buildAssociatedAssignmentItem,
  buildAssociatedLectureItem,
  type AssociatedAssignmentRow,
  type AssociatedLectureRow,
} from '../buildAssociatedLearningItems'

const NOW = 1_000_000_000_000

function lectureRow(
  overrides: Partial<AssociatedLectureRow> = {},
): AssociatedLectureRow {
  return {
    id: 1,
    title: 'Intro',
    category: 'coding',
    type: 'video',
    optional: 0,
    schedule: null,
    concludes: null,
    sectionId: 5,
    week: 1,
    module: 'Module 1',
    hostName: 'Ananya',
    zoomLink: null,
    isNewZoomRedirection: 0,
    ...overrides,
  }
}

function assignmentRow(
  overrides: Partial<AssociatedAssignmentRow> = {},
): AssociatedAssignmentRow {
  return {
    id: 7,
    title: 'Lab 1',
    category: 'coding',
    type: 'assignment',
    optional: 0,
    schedule: null,
    concludes: null,
    week: 2,
    module: 'Module 2',
    hostName: 'Ravi',
    showScores: 0,
    ...overrides,
  }
}

describe('buildAssociatedLectureItem', () => {
  it('maps a lecture row to a listing item and keeps attendance for mandatory lectures', () => {
    const attendance = { status: 'present' } as never
    const item = buildAssociatedLectureItem(lectureRow(), attendance, NOW)

    expect(item.id).toBe(1)
    expect(item.learningType).toBe('lecture')
    expect(item.title).toBe('Intro')
    expect(item.hostName).toBe('Ananya')
    expect(item.moduleName).toBe('Module 1')
    expect(item.isOptional).toBe('mandatory')
    expect(item.attendance).toBe(attendance)
    expect(item.resourcePhase).toBeNull()
    expect(item.listingCtas.joinLive).toBe('hidden')
  })

  it('classifies a reading row as a resource with a phase and no attendance', () => {
    const item = buildAssociatedLectureItem(
      lectureRow({ id: 3, type: 'reading', hostName: null }),
      null,
      NOW,
    )

    expect(item.learningType).toBe('resource')
    expect(item.resourcePhase).not.toBeNull()
    expect(item.attendance).toBeNull()
    expect(item.hostName).toBe('Unknown Instructor')
  })
})

describe('buildAssociatedAssignmentItem', () => {
  it('maps an assignment row with progress status', () => {
    const item = buildAssociatedAssignmentItem(assignmentRow(), null, NOW)

    expect(item.id).toBe(7)
    expect(item.learningType).toBe('assignment')
    expect(item.title).toBe('Lab 1')
    expect(typeof item.assignmentProgressStatus).toBe('string')
    expect(item.listingCtas.assignmentScore).toBeNull()
  })

  it('surfaces a released score when showScores is enabled', () => {
    const submission = {
      completed: true,
      status: 'graded',
      markAsCompleted: true,
      score: 8,
      data: { updatedScore: true },
    }
    const item = buildAssociatedAssignmentItem(
      assignmentRow({ showScores: 1 }),
      submission,
      NOW,
    )

    expect(item.listingCtas.assignmentScore).toBe(8)
  })
})
