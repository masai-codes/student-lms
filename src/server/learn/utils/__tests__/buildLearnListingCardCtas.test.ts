import { describe, expect, it } from 'vitest'

import { buildLearnListingCardCtas } from '../buildLearnListingCardCtas'

describe('buildLearnListingCardCtas', () => {
  const nowMs = new Date('2026-05-11T10:07:00.000Z').getTime()

  it('shows join live during the running window for live lectures with zoom', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://zoom.example/j/1',
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
    })

    expect(ctas.joinLive).toBe('active')
    expect(ctas.showAttendance).toBe(false)
  })

  it('shows attendance only after the session has ended', () => {
    const endedNow = new Date('2026-05-11T13:00:00.000Z').getTime()
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://zoom.example/j/1',
      nowMs: endedNow,
      attendance: {
        overallStatus: 0,
        notApplicable: false,
        hasStudentAttendanceEntry: true,
        isCatchupWindowOver: false,
        videoPercentage: 0,
        daysRemaining: 3,
        lateByMinutes: null,
      },
      assignmentProgressStatus: null,
    })

    expect(ctas.joinLive).toBe('hidden')
    expect(ctas.showAttendance).toBe(true)
  })

  it('hides assignment status chip for new assignments', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'assignment',
      itemType: 'coding',
      schedule: '2026-05-12T10:00:00.000Z',
      concludes: '2026-05-13T10:00:00.000Z',
      isMandatory: true,
      zoomLink: null,
      nowMs,
      attendance: null,
      assignmentProgressStatus: 'new',
    })

    expect(ctas.assignmentStatusChip).toBeNull()
  })

  it('sets the assignment deadline label from the concludes countdown', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'assignment',
      itemType: 'coding',
      schedule: '2026-05-10T10:00:00.000Z',
      concludes: '2026-05-13T12:00:00.000Z', // ~2 days from nowMs
      isMandatory: true,
      zoomLink: null,
      nowMs,
      attendance: null,
      assignmentProgressStatus: 'in-progress',
    })

    expect(ctas.assignmentDeadlineLabel).toBe('2 days remaining')
  })

  it('leaves the deadline label null for lectures', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: null,
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
    })

    expect(ctas.assignmentDeadlineLabel).toBeNull()
  })
})
