import type {
  LectureAttendanceStatus,
  VisibleLectureAttendanceStatus,
} from '@/lib/lecture-attendance/lectureAttendanceStatus'

export type LectureAttendanceUiState = LectureAttendanceStatus

export type LectureAttendanceUiInput = {
  overallStatus: number | null | undefined
  notApplicable?: boolean | null
  hasStudentAttendanceEntry?: boolean | null
  isCatchupWindowOver?: boolean | null
  videoPercentage?: number | null
  localWatchPercentage?: number | null
  daysRemaining?: number | null
}

export type ListingAttendanceVisibleState = VisibleLectureAttendanceStatus

/**
 * What the lecture card / detail header actually renders — produced only by
 * `getLectureAttendanceRender`, the single resolver both surfaces share.
 */
export type LectureAttendanceRender = {
  uiState: VisibleLectureAttendanceStatus | null
  daysRemaining: number | null
  showBadge: boolean
  /**
   * `batches.is_attendance_mandatory = 0`: the worded Present/Absent badges
   * collapse to a bare green tick / red cross (see
   * `LECTURE_ATTENDANCE_STATUS_META.iconOnlyWhenAttendanceOptional`).
   */
  iconOnly: boolean
}
