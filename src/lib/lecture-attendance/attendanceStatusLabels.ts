import { usesWatchedAttendanceWording } from '@/utils/portal'

/**
 * Single source for the student-facing attendance wording, so the badge, the
 * breakdown tooltip and the support-chat snapshot never disagree.
 *
 * Masai / iHub keep the presence wording (Present / Absent). IIT Jodhpur reads
 * lectures as recordings, so the same states are worded as watch progress —
 * both absent states collapse to the same "Not Watched" label (they still
 * render distinct icons/colours, see `LectureAttendanceStatusBadge`).
 */
export type AttendanceStatusLabels = {
  present: string
  absent: string
  /** Absent *and* the catch-up window has closed. */
  attWindowOver: string
}

const PRESENCE_LABELS: AttendanceStatusLabels = {
  present: 'Present',
  absent: 'Absent',
  attWindowOver: 'Absent and Att. Window Over',
}

const WATCHED_LABELS: AttendanceStatusLabels = {
  present: 'Watched',
  absent: 'Not Watched',
  attWindowOver: 'Not Watched',
}

/** Attendance wording for the portal we're running on. */
export function getAttendanceStatusLabels(): AttendanceStatusLabels {
  return usesWatchedAttendanceWording() ? WATCHED_LABELS : PRESENCE_LABELS
}
