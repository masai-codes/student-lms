/** Raw attendance fields returned by learn APIs (listing + lecture detail). */
export type LectureAttendanceSummary = {
  /** `student_attendances.status`: 0 absent, 1 present; null when no row yet. */
  overallStatus: number | null
  notApplicable: boolean
  hasStudentAttendanceEntry: boolean
  isCatchupWindowOver: boolean | null
  videoPercentage: number
  daysRemaining: number | null
  /** Granular "time left" label for the catch-up window, e.g. "2 days 3 hours remaining". */
  remainingLabel: string | null
  lateByMinutes: number | null
  /** `student_attendances.live_attendance_status`: 1 attended live, 0 otherwise. */
  liveAttendanceStatus: number
  /** `student_attendances.video_attendance_status`: 1 recording watched, 0 otherwise. */
  videoAttendanceStatus: number
  /** Whether recording watch-time counts toward attendance for this section/record. */
  includeVideoAttendance: boolean
}

export type LectureAttendanceContext = {
  lectureId: number
  sectionId: number
  schedule: string | null
  concludes: string | null
  sectionSettings: unknown
}

export type StudentAttendanceRow = {
  lectureId: number
  status: number
  videoPercentage: number
  includeVideoAttendance: number
  catchUpDays: number | null
  lateByMinutes: number | null
  liveAttendanceStatus?: number | null
  videoAttendanceStatus?: number | null
  meta: unknown
}
