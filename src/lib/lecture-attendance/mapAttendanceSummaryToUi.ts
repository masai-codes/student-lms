import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { resolveLectureAttendanceUiState } from '@/lib/lecture-attendance/resolveLectureAttendanceUiState'
import type { LectureAttendanceUiState } from '@/lib/lecture-attendance/types'

export function mapAttendanceSummaryToDetailUiState(
  attendance: LectureAttendanceSummary | null | undefined,
  watchPercentage?: number | null,
): LectureAttendanceUiState | null {
  if (attendance == null) {
    return null
  }

  if (
    attendance.hasStudentAttendanceEntry === false &&
    attendance.isCatchupWindowOver === true
  ) {
    return 'att_window_over'
  }

  if (
    attendance.hasStudentAttendanceEntry &&
    attendance.overallStatus != null
  ) {
    return resolveLectureAttendanceUiState({
      overallStatus: attendance.overallStatus,
      notApplicable: attendance.notApplicable,
      hasStudentAttendanceEntry: attendance.hasStudentAttendanceEntry,
      isCatchupWindowOver: attendance.isCatchupWindowOver,
      videoPercentage: attendance.videoPercentage,
      localWatchPercentage: watchPercentage,
      daysRemaining: attendance.daysRemaining,
    })
  }

  return null
}
