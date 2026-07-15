import { describe, expect, it } from 'vitest'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { resolveLectureCatchUpProgress } from '../resolveLectureCatchUpProgress'

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
    remainingLabel: null,
    lateByMinutes: null,
    liveAttendanceStatus: 0,
    videoAttendanceStatus: 0,
    includeVideoAttendance: true,
    ...overrides,
  }
}

describe('resolveLectureCatchUpProgress', () => {
  it('returns null when there is no attendance', () => {
    expect(resolveLectureCatchUpProgress(null)).toBeNull()
    expect(resolveLectureCatchUpProgress(undefined)).toBeNull()
  })

  it('shows the strip mid-catch-up when recording counts (continue_watching)', () => {
    // absent + partial stored video % + days remaining -> continue_watching.
    expect(
      resolveLectureCatchUpProgress(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          videoPercentage: 40,
          daysRemaining: 2,
          remainingLabel: '2 days remaining',
        }),
      ),
    ).toEqual({ daysRemaining: 2, remainingLabel: '2 days remaining' })
  })

  it('is hidden when recording watch-time does not count (live-only banner shown instead)', () => {
    expect(
      resolveLectureCatchUpProgress(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: false,
          videoPercentage: 40,
          daysRemaining: 2,
        }),
      ),
    ).toBeNull()
  })

  it('is hidden before any watch progress (absent -> banner shown, not the strip)', () => {
    expect(
      resolveLectureCatchUpProgress(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          videoPercentage: 0,
          daysRemaining: 2,
        }),
      ),
    ).toBeNull()
  })

  it('is hidden once already Present', () => {
    expect(
      resolveLectureCatchUpProgress(
        makeSummary({
          overallStatus: 1,
          includeVideoAttendance: true,
          videoPercentage: 40,
          daysRemaining: 2,
        }),
      ),
    ).toBeNull()
  })

  it('is hidden when the catch-up window is over', () => {
    expect(
      resolveLectureCatchUpProgress(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          videoPercentage: 40,
          daysRemaining: 0,
          isCatchupWindowOver: true,
        }),
      ),
    ).toBeNull()
  })
})
