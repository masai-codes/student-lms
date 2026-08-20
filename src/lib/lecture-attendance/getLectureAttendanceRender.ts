import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { resolveLectureAttendanceUiState } from '@/lib/lecture-attendance/resolveLectureAttendanceUiState'
import type {
  LectureAttendanceRender,
  ListingAttendanceVisibleState,
} from '@/lib/lecture-attendance/types'

export type LectureVideoProgressHint = {
  watchPercentage?: number | null
}

const HIDDEN_RENDER: LectureAttendanceRender = {
  uiState: null,
  daysRemaining: null,
  showBadge: false,
  iconOnly: false,
}

/**
 * THE single decision point for what attendance UI a lecture shows — used by
 * the /learn listing card, the lecture detail header, dashboard cards and the
 * support-chat snapshot, so every surface always agrees.
 *
 * The status itself comes from `resolveLectureAttendanceUiState` (see the
 * decision table in `lectureAttendanceStatus.ts`); this adds the surface
 * concerns: whether a badge shows at all, the catch-up countdown, and the
 * icon-only variant for non-mandatory-attendance batches.
 */
export function getLectureAttendanceRender(
  attendance: LectureAttendanceSummary | null | undefined,
  videoProgressHint?: LectureVideoProgressHint | null,
): LectureAttendanceRender {
  if (attendance == null) {
    return HIDDEN_RENDER
  }

  // `batches.is_attendance_mandatory = 0` → worded Present/Absent badges
  // collapse to a bare tick/cross. Pure presentation; the status logic below
  // is identical either way.
  const iconOnly = !attendance.isAttendanceMandatory

  if (attendance.overallStatus == null) {
    if (attendance.hasStudentAttendanceEntry === false) {
      if (attendance.isCatchupWindowOver === true) {
        return {
          uiState: 'att_window_over',
          daysRemaining: null,
          showBadge: true,
          iconOnly,
        }
      }
      if (attendance.daysRemaining != null && attendance.daysRemaining > 0) {
        return {
          uiState: 'absent',
          daysRemaining: attendance.daysRemaining,
          showBadge: false,
          iconOnly,
        }
      }
    }
    return HIDDEN_RENDER
  }

  const resolved = resolveLectureAttendanceUiState({
    overallStatus: attendance.overallStatus,
    notApplicable: attendance.notApplicable,
    hasStudentAttendanceEntry: attendance.hasStudentAttendanceEntry,
    isCatchupWindowOver: attendance.isCatchupWindowOver,
    videoPercentage: attendance.videoPercentage,
    // Prefer a live hint (lecture detail passes the player's current value);
    // otherwise fall back to the server watch progress on the summary so the
    // listing card resolves to the same state as the detail.
    localWatchPercentage:
      videoProgressHint?.watchPercentage ??
      attendance.watchPercentage ??
      undefined,
    daysRemaining: attendance.daysRemaining,
  })

  if (resolved === null || resolved === 'hidden') {
    return HIDDEN_RENDER
  }

  const uiState: ListingAttendanceVisibleState = resolved
  const showRemaining =
    attendance.daysRemaining != null &&
    attendance.isCatchupWindowOver !== true &&
    (uiState === 'absent' || uiState === 'continue_watching')
  const daysRemaining = showRemaining ? attendance.daysRemaining : null

  return { uiState, daysRemaining, showBadge: true, iconOnly }
}
