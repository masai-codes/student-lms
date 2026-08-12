export type LectureAttendanceUiState =
  'hidden' | 'present' | 'absent' | 'continue_watching' | 'att_window_over'

export type LectureAttendanceUiInput = {
  overallStatus: number | null | undefined
  notApplicable?: boolean | null
  hasStudentAttendanceEntry?: boolean | null
  isCatchupWindowOver?: boolean | null
  videoPercentage?: number | null
  localWatchPercentage?: number | null
  daysRemaining?: number | null
}

export type ListingAttendanceVisibleState = Exclude<
  LectureAttendanceUiState,
  'hidden'
>

export type ListingAttendanceRender = {
  uiState: ListingAttendanceVisibleState | null
  daysRemaining: number | null
  showBadge: boolean
}
