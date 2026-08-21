/** Raw attendance fields returned by learn APIs (listing + lecture detail). */
export type LectureAttendanceSummary = {
  /** `student_attendances.status`: 0 absent, 1 present; null when no row yet. */
  overallStatus: number | null
  notApplicable: boolean
  hasStudentAttendanceEntry: boolean
  isCatchupWindowOver: boolean | null
  videoPercentage: number
  /**
   * Live recording watch progress (0–100) read from `video_attendances.duration`
   * — the same source the lecture detail uses. Distinct from `videoPercentage`,
   * which is the attendance-scoring percentage on `student_attendances` and can
   * lag behind actual watch time. Keeping this on the summary lets the listing
   * card, dashboard and detail all resolve to the same watch state.
   */
  watchPercentage: number
  /** Whole days left in the catch-up window (legacy-parity — see `computeCatchUpWindow`). */
  daysRemaining: number | null
  lateByMinutes: number | null
  /** `student_attendances.live_attendance_status`: 1 attended live, 0 otherwise. */
  liveAttendanceStatus: number
  /** `student_attendances.video_attendance_status`: 1 recording watched, 0 otherwise. */
  videoAttendanceStatus: number
  /**
   * Whether video attendance is TRACKED (catch-up window applies) — true when
   * the section enables video attendance OR counts it for actual attendance.
   * Drives the catch-up window / breakdown, NOT the disclaimer banner variant.
   */
  includeVideoAttendance: boolean
  /**
   * Section setting `considerVideoAttendanceForActualAttendance`: whether
   * watching the recording actually COUNTS toward the Present/Absent status.
   * Section-derived (reliable even when the per-student row is stale). Drives
   * the lecture-detail disclaimer banner variant — legacy parity with
   * `video_attendance_considered_in_section`.
   */
  videoCountsForAttendance: boolean
  /**
   * Section setting `markAbsentIfLate`: whether joining the live session late
   * (beyond grace, per `lateByMinutes`) marks the student Absent by itself.
   * Drives the floating-support absent reason copy.
   */
  markAbsentIfLate: boolean
  /**
   * `batches.is_attendance_mandatory` for the lecture's section's batch.
   * Presentation-only: when false, the worded Present/Absent badges render as
   * a bare green tick / red cross. No status logic reads it.
   */
  isAttendanceMandatory: boolean
}

export type LectureAttendanceContext = {
  lectureId: number
  sectionId: number
  schedule: string | null
  concludes: string | null
  sectionSettings: unknown
  /** `batches.is_attendance_mandatory`; defaults to true when not provided. */
  isAttendanceMandatory?: boolean
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
