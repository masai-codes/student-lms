import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { mapAttendanceSummaryToDetailUiState } from './mapAttendanceSummaryToUi'

/**
 * The "catch-up progress" strip shown inside the lecture detail while the
 * student is mid-catch-up on a recording that counts toward attendance.
 *
 * Legacy parity: the old LMS replaced the blue disclaimer banner with a dark
 * progress strip ("Watch the full video to mark your attendance" + watched
 * progress + days-remaining pill) in exactly the `continue_watching` state when
 * recording watch-time is considered. This resolver reproduces that gate, so
 * the strip and {@link resolveLectureAttendanceBanner} are mutually exclusive:
 * the banner returns `null` for `continue_watching` (video considered), which is
 * precisely when this strip takes over.
 *
 * Like the banner, the gate is derived from the server-reconciled attendance
 * (no live watch-percentage), so it does not appear/disappear from live playback
 * mid-session — it reflects the stored catch-up state.
 */
export type LectureCatchUpProgress = {
  daysRemaining: number | null
  remainingLabel: string | null
}

export function resolveLectureCatchUpProgress(
  attendance: LectureAttendanceSummary | null | undefined,
): LectureCatchUpProgress | null {
  if (attendance == null) {
    return null
  }
  // Recording watch-time must count toward attendance — otherwise watching can
  // never mark the student Present and the "watch to mark attendance" strip
  // would be misleading (the `live-only` banner is shown instead).
  if (!attendance.includeVideoAttendance) {
    return null
  }
  if (mapAttendanceSummaryToDetailUiState(attendance) !== 'continue_watching') {
    return null
  }
  return {
    daysRemaining: attendance.daysRemaining,
    remainingLabel: attendance.remainingLabel,
  }
}
