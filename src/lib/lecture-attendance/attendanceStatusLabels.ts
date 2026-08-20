/**
 * Single source for the student-facing attendance wording, so the badge, the
 * breakdown tooltip and the support-chat snapshot never disagree.
 */
export type AttendanceStatusLabels = {
  present: string
  absent: string
  /** Absent *and* the catch-up window has closed. */
  attWindowOver: string
}

export const ATTENDANCE_STATUS_LABELS: AttendanceStatusLabels = {
  present: 'Present',
  absent: 'Absent',
  attWindowOver: 'Absent and Att. Window Over',
}
