import { describe, expect, it } from 'vitest'

import { buildLectureAttendanceSummary } from '../buildLectureAttendanceSummary'

const context = {
  lectureId: 1,
  sectionId: 2,
  schedule: '2026-05-01T10:00:00.000Z',
  concludes: '2026-05-01T12:00:00.000Z',
  sectionSettings: { enableVideoAttendance: true, catchUpDays: 5 },
}

describe('buildLectureAttendanceSummary', () => {
  it('returns present summary when status is 1', () => {
    const summary = buildLectureAttendanceSummary(
      context,
      {
        lectureId: 1,
        status: 1,
        videoPercentage: 80,
        includeVideoAttendance: 1,
        catchUpDays: 5,
        lateByMinutes: null,
        liveAttendanceStatus: 1,
        videoAttendanceStatus: 1,
        meta: { notApplicable: false },
      },
      Date.now(),
    )

    expect(summary.overallStatus).toBe(1)
    expect(summary.hasStudentAttendanceEntry).toBe(true)
    expect(summary.notApplicable).toBe(false)
  })

  it('computes catch-up fields for absent students without a DB row', () => {
    const nowMs = new Date('2026-05-04T12:00:00.000Z').getTime()
    const summary = buildLectureAttendanceSummary(context, null, nowMs)

    expect(summary.overallStatus).toBeNull()
    expect(summary.hasStudentAttendanceEntry).toBe(false)
    expect(summary.notApplicable).toBe(true)
    expect(summary.daysRemaining).toBe(2)
    expect(summary.isCatchupWindowOver).toBe(false)
  })

  it('carries the live video watch percentage from video_attendances', () => {
    const summary = buildLectureAttendanceSummary(context, null, Date.now(), 40)

    expect(summary.watchPercentage).toBe(40)
  })

  it('defaults watch percentage to 0 when no watch row exists', () => {
    const summary = buildLectureAttendanceSummary(context, null, Date.now())

    expect(summary.watchPercentage).toBe(0)
  })

  it('reads markAbsentIfLate from the section settings', () => {
    const summary = buildLectureAttendanceSummary(
      { ...context, sectionSettings: { markAbsentIfLate: true } },
      null,
      Date.now(),
    )

    expect(summary.markAbsentIfLate).toBe(true)
  })

  it('defaults markAbsentIfLate to false when unset', () => {
    const summary = buildLectureAttendanceSummary(context, null, Date.now())

    expect(summary.markAbsentIfLate).toBe(false)
  })
})
