import { describe, expect, it } from 'vitest'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { getLectureAttendanceRender } from '../getLectureAttendanceRender'

function makeSummary(
  overrides: Partial<LectureAttendanceSummary> = {},
): LectureAttendanceSummary {
  return {
    overallStatus: 0,
    notApplicable: false,
    hasStudentAttendanceEntry: true,
    isCatchupWindowOver: null,
    videoPercentage: 0,
    watchPercentage: 0,
    daysRemaining: null,
    lateByMinutes: null,
    liveAttendanceStatus: 0,
    videoAttendanceStatus: 0,
    includeVideoAttendance: false,
    videoCountsForAttendance: false,
    markAbsentIfLate: false,
    isAttendanceMandatory: true,
    ...overrides,
  }
}

describe('getLectureAttendanceRender', () => {
  it('returns no badge when attendance is missing', () => {
    expect(getLectureAttendanceRender(null)).toEqual({
      uiState: null,
      daysRemaining: null,
      showBadge: false,
      iconOnly: false,
    })
  })

  it('shows att_window_over without a row', () => {
    expect(
      getLectureAttendanceRender(
        makeSummary({
          overallStatus: null,
          notApplicable: true,
          hasStudentAttendanceEntry: false,
          isCatchupWindowOver: true,
          daysRemaining: 0,
        }),
      ),
    ).toEqual({
      uiState: 'att_window_over',
      daysRemaining: null,
      showBadge: true,
      iconOnly: false,
    })
  })

  it('shows present badge for marked present lectures', () => {
    expect(
      getLectureAttendanceRender(
        makeSummary({ overallStatus: 1, videoPercentage: 100 }),
      ),
    ).toEqual({
      uiState: 'present',
      daysRemaining: null,
      showBadge: true,
      iconOnly: false,
    })
  })

  it('flags icon-only rendering when the batch attendance is not mandatory', () => {
    expect(
      getLectureAttendanceRender(
        makeSummary({ overallStatus: 1, isAttendanceMandatory: false }),
      ),
    ).toEqual({
      uiState: 'present',
      daysRemaining: null,
      showBadge: true,
      iconOnly: true,
    })
  })

  it('keeps the same status logic regardless of isAttendanceMandatory', () => {
    const mandatory = getLectureAttendanceRender(
      makeSummary({ isAttendanceMandatory: true }),
    )
    const optional = getLectureAttendanceRender(
      makeSummary({ isAttendanceMandatory: false }),
    )
    expect(optional.uiState).toBe(mandatory.uiState)
    expect(optional.daysRemaining).toBe(mandatory.daysRemaining)
    expect(optional.showBadge).toBe(mandatory.showBadge)
  })
})
