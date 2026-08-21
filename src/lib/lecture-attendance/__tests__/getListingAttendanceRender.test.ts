import { describe, expect, it } from 'vitest'

import { getListingAttendanceRender } from '../getListingAttendanceRender'

describe('getListingAttendanceRender', () => {
  it('returns no badge when attendance is missing', () => {
    expect(getListingAttendanceRender(null)).toEqual({
      uiState: null,
      daysRemaining: null,
      showBadge: false,
    })
  })

  it('shows att_window_over without a row', () => {
    expect(
      getListingAttendanceRender({
        overallStatus: null,
        notApplicable: true,
        hasStudentAttendanceEntry: false,
        isCatchupWindowOver: true,
        videoPercentage: 0,
        watchPercentage: 0,
        daysRemaining: 0,
        lateByMinutes: null,
        liveAttendanceStatus: 0,
        videoAttendanceStatus: 0,
        includeVideoAttendance: false,
        videoCountsForAttendance: false,
        markAbsentIfLate: false,
        videoWatchThreshold: null,
      }),
    ).toEqual({
      uiState: 'att_window_over',
      daysRemaining: null,
      showBadge: true,
    })
  })

  it('shows present badge for marked present lectures', () => {
    expect(
      getListingAttendanceRender({
        overallStatus: 1,
        notApplicable: false,
        hasStudentAttendanceEntry: true,
        isCatchupWindowOver: null,
        videoPercentage: 100,
        watchPercentage: 0,
        daysRemaining: null,
        lateByMinutes: null,
        liveAttendanceStatus: 0,
        videoAttendanceStatus: 0,
        includeVideoAttendance: false,
        videoCountsForAttendance: false,
        markAbsentIfLate: false,
        videoWatchThreshold: null,
      }),
    ).toEqual({
      uiState: 'present',
      daysRemaining: null,
      showBadge: true,
    })
  })
})
