import { describe, expect, it } from 'vitest'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import {
  LECTURE_ATTENDANCE_BANNERS,
  resolveLectureAttendanceBanner,
} from '../resolveLectureAttendanceBanner'

function makeSummary(
  overrides: Partial<LectureAttendanceSummary> = {},
): LectureAttendanceSummary {
  return {
    overallStatus: 0,
    notApplicable: false,
    hasStudentAttendanceEntry: true,
    isCatchupWindowOver: null,
    videoPercentage: 0,
    daysRemaining: null,
    remainingLabel: null,
    lateByMinutes: null,
    liveAttendanceStatus: 0,
    videoAttendanceStatus: 0,
    includeVideoAttendance: true,
    ...overrides,
  }
}

describe('resolveLectureAttendanceBanner', () => {
  it('returns null when there is no attendance (optional/recommended lecture)', () => {
    expect(resolveLectureAttendanceBanner(null)).toBeNull()
    expect(resolveLectureAttendanceBanner(undefined)).toBeNull()
  })

  it('returns null when the UI state resolves to null (no usable entry)', () => {
    // overallStatus null with an entry -> resolver yields null
    expect(
      resolveLectureAttendanceBanner(makeSummary({ overallStatus: null })),
    ).toBeNull()
  })

  it('returns null when the UI state is hidden (not applicable + absent)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ overallStatus: 0, notApplicable: true }),
      ),
    ).toBeNull()
  })

  it('shows the video-counts banner when recording watch-time counts (present)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ overallStatus: 1, includeVideoAttendance: true }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])
  })

  it('shows the video-counts banner when recording counts (absent, window over)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          isCatchupWindowOver: true,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])
  })

  it('hides the banner mid-watch when recording counts (progress bar shown instead)', () => {
    // absent + partial watch + days remaining -> continue_watching, video counts
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          videoPercentage: 40,
          daysRemaining: 2,
        }),
      ),
    ).toBeNull()
  })

  it('shows the live-only banner when recording watch-time does not count', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ overallStatus: 0, includeVideoAttendance: false }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['live-only'])
  })

  it('still shows live-only mid-watch when recording does not count', () => {
    // continue_watching but video does NOT count -> live-only (no progress bar)
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: false,
          videoPercentage: 40,
          daysRemaining: 2,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['live-only'])
  })

  it('prefers the local watch percentage over the stored one for mid-watch', () => {
    // stored says 0%, local says 40% -> continue_watching, video counts -> hidden
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          videoPercentage: 0,
          daysRemaining: 2,
        }),
        40,
      ),
    ).toBeNull()
  })
})
