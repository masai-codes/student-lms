import type { LectureAttendanceSummary } from '@/server/attendance/types'

/**
 * Blue "attendance disclaimer" banner on the lecture detail page.
 *
 * Ported from the legacy LMS `AttendanceDisclaimer`. When a recording is present
 * on the page, the banner shows one of two messages decided SOLELY by whether
 * recording watch-time counts toward attendance for this section
 * (`includeVideoAttendance`, aka "consider video attendance for actual
 * attendance"). No watch-progress / present / catch-up-window state is involved —
 * the banner is always visible while the recording is shown, so it never
 * disappears mid-watch.
 */
export type LectureAttendanceBannerKey = 'video-counts' | 'live-only'

export type LectureAttendanceBannerDescriptor = {
  key: LectureAttendanceBannerKey
  /** Exact disclaimer copy (legacy parity). */
  text: string
  testId: string
}

/** All banner variants, keyed for lookup. Add new copy here, not in the resolver. */
export const LECTURE_ATTENDANCE_BANNERS: Record<
  LectureAttendanceBannerKey,
  LectureAttendanceBannerDescriptor
> = {
  // Section counts recording watch-time toward attendance.
  'video-counts': {
    key: 'video-counts',
    text: 'Once you finish watching the complete lecture recording, your status will change to Present after 24 hours.',
    testId: 'lecture-attendance-banner-video-counts',
  },
  // Section only counts live attendance; recording is watch-only.
  'live-only': {
    key: 'live-only',
    text: 'You can watch this recording, but it will not be considered for updating your attendance status. Only live class attendance will be counted.',
    testId: 'lecture-attendance-banner-live-only',
  },
}

/**
 * Decide which attendance disclaimer banner to show while a recording is present
 * on the lecture detail page. The choice is made solely on whether recording
 * watch-time counts toward attendance:
 *
 * - `includeVideoAttendance === true`  → `video-counts` ("watch it to become Present")
 * - `includeVideoAttendance === false` → `live-only` ("watching won't count")
 *
 * Returns `null` only when there is no attendance record at all (e.g. optional /
 * recommended lectures), where the disclaimer does not apply.
 */
export function resolveLectureAttendanceBanner(
  attendance: LectureAttendanceSummary | null | undefined,
): LectureAttendanceBannerDescriptor | null {
  if (attendance == null) {
    return null
  }

  return attendance.includeVideoAttendance
    ? LECTURE_ATTENDANCE_BANNERS['video-counts']
    : LECTURE_ATTENDANCE_BANNERS['live-only']
}
