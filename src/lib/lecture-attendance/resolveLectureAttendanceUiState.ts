import type {
  LectureAttendanceUiInput,
  LectureAttendanceUiState,
} from '@/lib/lecture-attendance/types'

export function resolveLectureAttendanceUiState(
  input: LectureAttendanceUiInput,
): LectureAttendanceUiState | null {
  const {
    overallStatus,
    notApplicable,
    hasStudentAttendanceEntry,
    isCatchupWindowOver,
    videoPercentage,
    localWatchPercentage,
    daysRemaining,
  } = input

  const effectiveNotApplicable =
    hasStudentAttendanceEntry === false ? false : notApplicable

  if (overallStatus === 1) {
    return 'present'
  }

  if (overallStatus !== 0) {
    return null
  }

  const effectiveWatchPercentage = localWatchPercentage ?? videoPercentage
  const hasWatchProgressFromVideoApi =
    effectiveWatchPercentage != null &&
    effectiveWatchPercentage > 0 &&
    effectiveWatchPercentage < 100
  const hasDaysRemaining = (daysRemaining ?? 0) > 0

  /**
   * A catch-up window is only computed for a lecture whose attendance is
   * actually tracked for this student (`computeCatchUpWindow` returns
   * `null`/`null` otherwise), so a non-null window means attendance IS
   * applicable — whatever `meta.notApplicable` says on the row.
   *
   * This guard matters because the first video-watch backfill inserts a
   * placeholder `student_attendances` row carrying `meta.notApplicable = true`
   * (`storeVideoProgress`). Without it, simply watching the recording flips a
   * lecture from `absent` / `att_window_over` to `hidden` — the badge that was
   * showing before the watch silently disappears.
   */
  const isAttendanceTracked = isCatchupWindowOver != null

  // Terminal state: once the catch-up window is over the recording can no
  // longer earn attendance, so watch progress must never replace or hide it.
  if (isCatchupWindowOver === true) {
    return 'att_window_over'
  }

  if (hasWatchProgressFromVideoApi && hasDaysRemaining) {
    return 'continue_watching'
  }

  if (effectiveNotApplicable === true && !isAttendanceTracked) {
    return 'hidden'
  }

  return 'absent'
}
