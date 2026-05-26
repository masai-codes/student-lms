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

  const hasWatchProgressFromVideoApi =
    localWatchPercentage != null &&
    localWatchPercentage > 0 &&
    localWatchPercentage < 100
  const hasDaysRemaining = (daysRemaining ?? 0) > 0

  if (hasWatchProgressFromVideoApi && hasDaysRemaining) {
    return 'continue_watching'
  }

  if (effectiveNotApplicable === true) {
    return 'hidden'
  }

  if (isCatchupWindowOver === true) {
    return 'att_window_over'
  }

  return 'absent'
}
