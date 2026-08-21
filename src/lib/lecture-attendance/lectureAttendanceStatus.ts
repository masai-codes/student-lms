/**
 * THE canonical list of lecture attendance statuses a student can see, with
 * each status's meaning, student-facing label, and the exact condition that
 * produces it — so nobody has to reverse-engineer the resolver again.
 *
 * How a status is decided (single resolver, used by BOTH the /learn lecture
 * card and the lecture detail header — see `getLectureAttendanceRender`):
 *
 * Inputs (built in `buildLectureAttendanceSummary` from DB columns):
 * - `student_attendances.status`: 1 = present, 0 = absent, no row = unknown
 * - catch-up window (`computeCatchUpWindow`): only computed when the student
 *   is absent AND the section tracks video attendance AND `catchUpDays > 0`;
 *   otherwise "not tracked" (both fields null)
 * - watch % : live player value → `video_attendances.duration` →
 *   `student_attendances.video_percentage`
 * - `student_attendances.meta.notApplicable`: placeholder/not-a-real-verdict rows
 *
 * Decision order (first match wins — `resolveLectureAttendanceUiState`):
 * 1. status = 1                                        → PRESENT
 * 2. status = 0 and window over                        → ATT_WINDOW_OVER
 * 3. status = 0 and 0 < watch% < 100 and days left > 0 → CONTINUE_WATCHING
 * 4. status = 0, notApplicable, window not tracked     → HIDDEN
 * 5. status = 0 (anything else)                        → ABSENT
 * 6. no row and window over                            → ATT_WINDOW_OVER
 * 7. no row and days left > 0                          → ABSENT (countdown only, no badge)
 * 8. no row otherwise                                  → HIDDEN
 *
 * The badge is only considered at all for a mandatory lecture
 * (`lectures.optional = 0`) whose session has ended; optional lectures render
 * the "Optional session" chip + info tooltip instead.
 */
export const LECTURE_ATTENDANCE_STATUS = {
  /**
   * Attendance earned — via live attendance, watching the recording in time,
   * or a combination of the two whose summed percentage meets the section's
   * threshold (e.g. 20% live + 40% recording against a 60% threshold).
   */
  PRESENT: 'present',
  /** Marked (or defaulting to) absent; catch-up window may still be open. */
  ABSENT: 'absent',
  /** Absent but mid-way through the recording with catch-up days left. */
  CONTINUE_WATCHING: 'continue_watching',
  /** Absent and the catch-up window has closed — terminal, watching no longer helps. */
  ATT_WINDOW_OVER: 'att_window_over',
  /** Attendance isn't tracked for this student/lecture — show nothing. */
  HIDDEN: 'hidden',
} as const

export type LectureAttendanceStatus =
  (typeof LECTURE_ATTENDANCE_STATUS)[keyof typeof LECTURE_ATTENDANCE_STATUS]

/** Statuses that actually render a badge (everything except `hidden`). */
export type VisibleLectureAttendanceStatus = Exclude<
  LectureAttendanceStatus,
  'hidden'
>

export type LectureAttendanceStatusMeta = {
  /** Student-facing badge wording. */
  label: string
  /** Colour family every surface uses for this status. */
  tone: 'success' | 'danger' | 'brand'
  /**
   * Whether the label is swapped for a bare tick/cross icon when the batch's
   * attendance is not mandatory (`batches.is_attendance_mandatory = 0`).
   * Only the worded Present/Absent states collapse to icons; Continue
   * Watching keeps its wording.
   */
  iconOnlyWhenAttendanceOptional: boolean
}

export const LECTURE_ATTENDANCE_STATUS_META: Record<
  VisibleLectureAttendanceStatus,
  LectureAttendanceStatusMeta
> = {
  present: {
    label: 'Present',
    tone: 'success',
    iconOnlyWhenAttendanceOptional: true,
  },
  absent: {
    label: 'Absent',
    tone: 'danger',
    iconOnlyWhenAttendanceOptional: true,
  },
  continue_watching: {
    label: 'Continue Watching',
    tone: 'brand',
    iconOnlyWhenAttendanceOptional: false,
  },
  att_window_over: {
    label: 'Absent and Att. Window Over',
    tone: 'danger',
    iconOnlyWhenAttendanceOptional: true,
  },
}
