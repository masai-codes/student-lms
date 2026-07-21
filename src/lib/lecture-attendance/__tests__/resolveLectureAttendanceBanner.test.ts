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
    videoCountsForAttendance: true,
    ...overrides,
  }
}

describe('resolveLectureAttendanceBanner', () => {
  it('returns null when there is no attendance context (no section)', () => {
    expect(resolveLectureAttendanceBanner(null)).toBeNull()
    expect(resolveLectureAttendanceBanner(undefined)).toBeNull()
  })

  it('shows video-counts when watching the recording counts toward attendance', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ videoCountsForAttendance: true }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])
  })

  it('shows live-only when watching the recording does not count', () => {
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({ videoCountsForAttendance: false }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['live-only'])
  })

  it('keys off videoCountsForAttendance, NOT includeVideoAttendance', () => {
    // Section tracks video for a catch-up window (includeVideoAttendance true)
    // but does NOT count it toward actual attendance → live-only.
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          includeVideoAttendance: true,
          videoCountsForAttendance: false,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['live-only'])
  })

  it('decides solely on the flag — independent of status, watch progress and window', () => {
    // Already Present, fully watched, window over: still video-counts when the
    // flag is on (no other state influences the banner).
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 1,
          videoPercentage: 100,
          watchPercentage: 100,
          isCatchupWindowOver: true,
          videoCountsForAttendance: true,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])

    // Same state but flag off → live-only.
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 1,
          videoPercentage: 100,
          watchPercentage: 100,
          isCatchupWindowOver: true,
          videoCountsForAttendance: false,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['live-only'])
  })

  it('does not disappear mid-watch — live watch progress is not an input', () => {
    // Absent, partial watch, days remaining (the old "continue_watching" case
    // that used to hide the banner): flag on → banner stays as video-counts.
    expect(
      resolveLectureAttendanceBanner(
        makeSummary({
          overallStatus: 0,
          videoPercentage: 40,
          watchPercentage: 40,
          daysRemaining: 2,
          videoCountsForAttendance: true,
        }),
      ),
    ).toBe(LECTURE_ATTENDANCE_BANNERS['video-counts'])
  })
})
