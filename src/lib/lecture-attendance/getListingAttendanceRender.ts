import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { resolveLectureAttendanceUiState } from '@/lib/lecture-attendance/resolveLectureAttendanceUiState'
import type {
  ListingAttendanceRender,
  ListingAttendanceVisibleState,
} from '@/lib/lecture-attendance/types'

export type ListingVideoProgressHint = {
  watchPercentage?: number | null
}

export function getListingAttendanceRender(
  attendance: LectureAttendanceSummary | null | undefined,
  videoProgressHint?: ListingVideoProgressHint | null,
): ListingAttendanceRender {
  if (attendance == null) {
    return { uiState: null, daysRemaining: null, showBadge: false }
  }

  if (attendance.overallStatus == null) {
    if (attendance.hasStudentAttendanceEntry === false) {
      if (attendance.isCatchupWindowOver === true) {
        return { uiState: 'att_window_over', daysRemaining: null, showBadge: true }
      }
      if (attendance.daysRemaining != null && attendance.daysRemaining > 0) {
        return {
          uiState: 'absent',
          daysRemaining: attendance.daysRemaining,
          showBadge: false,
        }
      }
    }
    return { uiState: null, daysRemaining: null, showBadge: false }
  }

  const resolved = resolveLectureAttendanceUiState({
    overallStatus: attendance.overallStatus,
    notApplicable: attendance.notApplicable,
    hasStudentAttendanceEntry: attendance.hasStudentAttendanceEntry,
    isCatchupWindowOver: attendance.isCatchupWindowOver,
    videoPercentage: attendance.videoPercentage,
    localWatchPercentage: videoProgressHint?.watchPercentage ?? undefined,
    daysRemaining: attendance.daysRemaining,
  })

  if (resolved === null || resolved === 'hidden') {
    return { uiState: null, daysRemaining: null, showBadge: false }
  }

  const uiState: ListingAttendanceVisibleState = resolved
  const daysRemaining =
    attendance.daysRemaining != null &&
    attendance.isCatchupWindowOver !== true &&
    (uiState === 'absent' || uiState === 'continue_watching')
      ? attendance.daysRemaining
      : null

  return { uiState, daysRemaining, showBadge: true }
}
