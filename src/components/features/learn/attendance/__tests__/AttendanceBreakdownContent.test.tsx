// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AttendanceBreakdownContent } from '../AttendanceBreakdownContent'

import type { LectureAttendanceSummary } from '@/server/attendance/types'

function makeAttendance(
  overrides: Partial<LectureAttendanceSummary> = {},
): LectureAttendanceSummary {
  return {
    overallStatus: 0,
    notApplicable: false,
    hasStudentAttendanceEntry: true,
    isCatchupWindowOver: false,
    videoPercentage: 0,
    watchPercentage: 0,
    daysRemaining: null,
    lateByMinutes: null,
    liveAttendanceStatus: 0,
    videoAttendanceStatus: 0,
    includeVideoAttendance: true,
    videoCountsForAttendance: true,
    markAbsentIfLate: false,
    isAttendanceMandatory: true,
    ...overrides,
  }
}

describe('AttendanceBreakdownContent (optional-session info tooltip)', () => {
  afterEach(() => cleanup())

  it('shows Overall - Absent when the batch attendance is mandatory', () => {
    render(
      <AttendanceBreakdownContent attendance={makeAttendance()} isLiveLecture />,
    )
    expect(screen.getByText('Overall - Absent')).toBeTruthy()
  })

  it('hides Overall - Absent when the batch attendance is not mandatory', () => {
    render(
      <AttendanceBreakdownContent
        attendance={makeAttendance({ isAttendanceMandatory: false })}
        isLiveLecture
      />,
    )
    expect(screen.queryByText(/Overall -/)).toBeNull()
    // The Live/Recording lines still show.
    expect(screen.getByText('Live - Not Attended')).toBeTruthy()
    expect(screen.getByText('Recording - Not Watched')).toBeTruthy()
  })

  it('still shows Overall - Present when the batch attendance is not mandatory', () => {
    render(
      <AttendanceBreakdownContent
        attendance={makeAttendance({
          overallStatus: 1,
          isAttendanceMandatory: false,
        })}
        isLiveLecture
      />,
    )
    expect(screen.getByText('Overall - Present')).toBeTruthy()
  })
})
