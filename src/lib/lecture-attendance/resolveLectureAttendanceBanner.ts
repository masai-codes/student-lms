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
 * | present    | 'hidden'                                     | —                      | none          |
 * | present    | null (no row / window open)                  | true                   | video-counts⁴ |
 * | present    | null (no row / window over)                  | true                   | none          |
 * | present    | null (no row)                                | false                  | live-only⁴    |
 * | present    | 'present'                                    | true                   | none¹         |
 * | present    | 'att_window_over'                            | true                   | none¹         |
 * | present    | 'continue_watching'                          | true                   | none²         |
 * | present    | 'absent' (window open)                       | true                   | video-counts  |
 * | present    | 'present'                                    | false                  | none³         |
 * | present    | absent / att_window_over / continue_watching | false                  | live-only     |
 *
 * ¹ `video-counts` promises "watch it and you'll become Present". It is hidden
 *   when the student is already Present (nothing to earn) or the catch-up window
 *   is over (watching can no longer change the status) — no scope left either way.
 * ² Mid-watch: the catch-up progress bar is shown instead of the blue banner.
 * ³ `live-only` warns "watching won't count, only live does" — only relevant
 *   while the student is not yet Present, so it is hidden once already Present.
 * ⁴ No attendance row yet (student never marked): they are not Present, so the
 *   banner applies as if absent — legacy-LMS parity. A genuine "not applicable"
 *   placeholder row resolves to 'hidden' instead, so it stays suppressed.
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

  const { includeVideoAttendance, isCatchupWindowOver } = attendance

  // No resolvable UI state. The one case that still warrants a banner is a
  // genuine "no attendance row yet" (student never marked): they are not Present,
  // so the disclaimer applies exactly as it would for an absent student — legacy
  // LMS showed the banner here too; only its `=== 'hidden'` guard let it fall
  // through. Any other null (e.g. a row with an unresolvable status) stays
  // suppressed, as does a real "not applicable" placeholder row (→ 'hidden').
  if (uiState == null) {
    if (attendance.hasStudentAttendanceEntry !== false) {
      return null
    }
    if (!includeVideoAttendance) {
      // Watching can never count → warn that only live attendance counts.
      return LECTURE_ATTENDANCE_BANNERS['live-only']
    }
    // Recording counts: promise "watch to become Present" only while there is
    // still scope. A no-row lecture whose window is over resolves to
    // 'att_window_over' (not null), so reaching here normally means the window
    // is open; guard defensively anyway.
    if (isCatchupWindowOver === true) {
      return null
    }
    return LECTURE_ATTENDANCE_BANNERS['video-counts']
  }

  if (uiState === 'hidden') {
    return null
  }

  // Section only counts live attendance: watching the recording can never make
  // the student Present. The `live-only` banner warns about exactly that, so it
  // only matters while the student is not yet Present — once Present, there is
  // nothing left to clarify.
  if (!includeVideoAttendance) {
    if (uiState === 'present') {
      return null
    }
    return LECTURE_ATTENDANCE_BANNERS['live-only']
  }

  // Recording watch-time counts. The `video-counts` banner promises "watch it and
  // your status will change to Present" — only show it while that is actually
  // achievable, i.e. the student still has scope to earn Present by watching:
  // - 'present'          → already Present, no need to watch → hide
  // - 'att_window_over'  → catch-up window expired, watching can no longer help → hide
  // - 'continue_watching'→ mid-watch; the catch-up progress bar is shown instead → hide
  if (
    uiState === 'present' ||
    uiState === 'att_window_over' ||
    uiState === 'continue_watching'
  ) {
    return null
  }

  return LECTURE_ATTENDANCE_BANNERS['video-counts']
}
