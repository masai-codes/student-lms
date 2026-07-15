import { describe, expect, it } from 'vitest'

import { buildLearnListingCardCtas } from '../buildLearnListingCardCtas'

describe('buildLearnListingCardCtas', () => {
  const nowMs = new Date('2026-05-11T10:07:00.000Z').getTime()

  it('shows join live during the running window for live lectures with zoom', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      lectureId: 1,
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://zoom.example/j/1',
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
      assignmentScore: null,
    })

    expect(ctas.joinLive).toBe('active')
    expect(ctas.showAttendance).toBe(false)
    expect(ctas.joinZoomLink).toBe('https://zoom.example/j/1')
    expect(ctas.enableZoomWebView).toBe(false)
  })

  it('flags Zoom Web View for a shown, non-adaptive, non-ZEF live link', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      lectureId: 1,
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://zoom.example/j/1',
      isNewZoomRedirection: false,
      enableZoomWebView: true,
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
      assignmentScore: null,
    })

    expect(ctas.joinLive).toBe('active')
    expect(ctas.enableZoomWebView).toBe(true)
  })

  it('does not flag Zoom Web View for adaptive (SAL) or ZEF links', () => {
    const adaptive = buildLearnListingCardCtas({
      learningType: 'lecture',
      lectureId: 1,
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://api.example.com/api/adaptive-lecture/9/join',
      isNewZoomRedirection: false,
      enableZoomWebView: true,
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
      assignmentScore: null,
    })
    expect(adaptive.enableZoomWebView).toBe(false)

    const zef = buildLearnListingCardCtas({
      learningType: 'lecture',
      lectureId: 1,
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://zoom.example/j/1',
      isNewZoomRedirection: true,
      enableZoomWebView: true,
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
      assignmentScore: null,
    })
    expect(zef.enableZoomWebView).toBe(false)
  })

  it('shows attendance only after the session has ended', () => {
    const endedNow = new Date('2026-05-11T13:00:00.000Z').getTime()
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      lectureId: 2,
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: 'https://zoom.example/j/1',
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs: endedNow,
      attendance: {
        overallStatus: 0,
        notApplicable: false,
        hasStudentAttendanceEntry: true,
        isCatchupWindowOver: false,
        videoPercentage: 0,
        watchPercentage: 0,
        daysRemaining: 3,
        remainingLabel: '3 days remaining',
        lateByMinutes: null,
        liveAttendanceStatus: 0,
        videoAttendanceStatus: 0,
        includeVideoAttendance: false,
      },
      assignmentProgressStatus: null,
      assignmentScore: null,
    })

    expect(ctas.joinLive).toBe('hidden')
    expect(ctas.showAttendance).toBe(true)
  })

  it('hides assignment status chip for new assignments', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'assignment',
      lectureId: 3,
      itemType: 'coding',
      schedule: '2026-05-12T10:00:00.000Z',
      concludes: '2026-05-13T10:00:00.000Z',
      isMandatory: true,
      zoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs,
      attendance: null,
      assignmentProgressStatus: 'new',
      assignmentScore: null,
    })

    expect(ctas.assignmentStatusChip).toBeNull()
  })

  it('sets the assignment deadline label from the concludes countdown', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'assignment',
      lectureId: 4,
      itemType: 'coding',
      schedule: '2026-05-10T10:00:00.000Z',
      concludes: '2026-05-13T12:00:00.000Z', // ~2 days from nowMs
      isMandatory: true,
      zoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs,
      attendance: null,
      assignmentProgressStatus: 'in-progress',
      assignmentScore: null,
    })

    expect(ctas.assignmentDeadlineLabel).toBe('2 days remaining')
  })

  it('hides the deadline label once the assignment is completed', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'assignment',
      lectureId: 6,
      itemType: 'coding',
      schedule: '2026-05-10T10:00:00.000Z',
      concludes: '2026-05-13T12:00:00.000Z', // still in the future
      isMandatory: true,
      zoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs,
      attendance: null,
      assignmentProgressStatus: 'completed',
      assignmentScore: null,
    })

    expect(ctas.assignmentDeadlineLabel).toBeNull()
  })

  it('hides the deadline label before the assignment window opens', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'assignment',
      lectureId: 7,
      itemType: 'coding',
      schedule: '2026-05-12T10:00:00.000Z', // schedule is after nowMs
      concludes: '2026-05-13T12:00:00.000Z',
      isMandatory: true,
      zoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs,
      attendance: null,
      assignmentProgressStatus: 'new',
      assignmentScore: null,
    })

    expect(ctas.assignmentDeadlineLabel).toBeNull()
  })

  it('leaves the deadline label null for lectures', () => {
    const ctas = buildLearnListingCardCtas({
      learningType: 'lecture',
      lectureId: 5,
      itemType: 'live',
      schedule: '2026-05-11T10:00:00.000Z',
      concludes: '2026-05-11T12:00:00.000Z',
      isMandatory: true,
      zoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      nowMs,
      attendance: null,
      assignmentProgressStatus: null,
      assignmentScore: null,
    })

    expect(ctas.assignmentDeadlineLabel).toBeNull()
  })
})
