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

  it('shows video-counts when no attendance row exists yet, recording counts, window open', () => {
    // No student_attendances row: never marked. Still has scope to earn Present
    // by watching (legacy-LMS parity — new LMS previously showed nothing here).
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: null,
          hasStudentAttendanceEntry: false,
          includeVideoAttendance: true,
          isCatchupWindowOver: false,
          daysRemaining: 30,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])
  })

  it('hides the banner when no attendance row exists but the catch-up window is over', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: null,
          hasStudentAttendanceEntry: false,
          includeVideoAttendance: true,
          isCatchupWindowOver: true,
        }),
      ),
    ).toBeNull()
  })

  it('shows live-only when no attendance row exists and recording does not count', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: null,
          hasStudentAttendanceEntry: false,
          includeVideoAttendance: false,
          isCatchupWindowOver: null,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['live-only'])
  })

  it('returns null when the UI state is hidden (not applicable + absent)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ overallStatus: 0, notApplicable: true }),
      ),
    ).toBeNull()
  })

  it('shows the video-counts banner when recording counts and Present is still earnable (absent, window open)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          isCatchupWindowOver: false,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])
  })

  it('hides the video-counts banner when already Present (no need to watch)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ overallStatus: 1, includeVideoAttendance: true }),
      ),
    ).toBeNull()
  })

  it('hides the video-counts banner when the catch-up window is over (watching can no longer help)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          includeVideoAttendance: true,
          isCatchupWindowOver: true,
        }),
      ),
    ).toBeNull()
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

  it('hides the live-only banner when already Present (recording is irrelevant once Present)', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ overallStatus: 1, includeVideoAttendance: false }),
      ),
    ).toBeNull()
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
