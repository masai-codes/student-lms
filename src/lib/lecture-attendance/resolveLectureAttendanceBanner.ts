import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { mapAttendanceSummaryToDetailUiState } from './mapAttendanceSummaryToUi'
import type { LectureAttendanceUiState } from './types'

/**
 * Blue "attendance disclaimer" banners on the lecture detail page.
 *
 * Ported from the legacy LMS `AttendanceDisclaimer` component, which rendered
 * one of two info messages depending on whether recording watch-time counts
 * toward attendance for the section. This module keeps the "which banner shows
 * when" decision in one readable, testable place: the config table below lists
 * every banner variant, and {@link resolveLectureAttendanceBanner} is the single
 * rule set that maps attendance state → banner (or `null` for no banner).
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
 * Decide which attendance disclaimer banner (if any) to show on the lecture
 * detail page. First matching rule wins:
 *
 * | attendance | detail UI state                              | includeVideoAttendance | banner        |
 * | ---------- | -------------------------------------------- | ---------------------- | ------------- |
 * | null       | —                                            | —                      | none          |
 * | present    | null / 'hidden'                              | —                      | none          |
 * | present    | 'continue_watching'                          | true                   | none¹         |
 * | present    | present / absent / att_window_over / cont.²  | true                   | video-counts  |
 * | present    | present / absent / att_window_over / cont.   | false                  | live-only     |
 *
 * ¹ Legacy hides the blue banner here because the catch-up progress bar is
 *   shown instead when recording watch-time counts and the student is mid-watch.
 * ² 'continue_watching' still shows `live-only` when recording watch-time does
 *   not count (there is no progress bar to replace it).
 */
export function resolveLectureAttendanceBanner(
  attendance: LectureAttendanceSummary | null | undefined,
  watchPercentage?: number | null,
): LectureAttendanceBannerDescriptor | null {
  if (attendance == null) {
    return null
  }

  const uiState: LectureAttendanceUiState | null =
    mapAttendanceSummaryToDetailUiState(attendance, watchPercentage)

  if (uiState == null || uiState === 'hidden') {
    return null
  }

  const { includeVideoAttendance } = attendance

  if (includeVideoAttendance && uiState === 'continue_watching') {
    return null
  }

  return includeVideoAttendance
    ? LECTURE_ATTENDANCE_BANNERS['video-counts']
    : LECTURE_ATTENDANCE_BANNERS['live-only']
}
