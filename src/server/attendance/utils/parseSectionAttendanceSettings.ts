export type SectionAttendanceSettings = {
  /**
   * Video attendance is tracked at all (catch-up window applies). True when
   * EITHER `enableVideoAttendance` OR `considerVideoAttendanceForActualAttendance`
   * is set — used to decide whether to compute the catch-up window.
   */
  enableVideoAttendance: boolean
  /**
   * `considerVideoAttendanceForActualAttendance` verbatim: whether watching the
   * recording actually COUNTS toward the attendance status. Distinct from
   * `enableVideoAttendance` (a section can track video watching for a catch-up
   * window without letting it change the Present/Absent status). Drives the
   * lecture-detail disclaimer banner variant (legacy
   * `video_attendance_considered_in_section`).
   */
  considerVideoAttendanceForActualAttendance: boolean
  catchUpDays: number
  /**
   * `markAbsentIfLate` verbatim: whether joining the live session late (beyond
   * the lecture's grace period, tracked via `late_by_minutes`) marks the
   * student Absent. When false, a late join does not by itself cause an
   * Absent — the status still resolves from `live_attendance_status` /
   * recording-watch rules, and updates can take up to 24 hours to reflect.
   */
  markAbsentIfLate: boolean
}

export function parseSectionAttendanceSettings(
  settingsRaw: unknown,
): SectionAttendanceSettings {
  let settings: Record<string, unknown> = {}

  if (typeof settingsRaw === 'string') {
    try {
      settings = JSON.parse(settingsRaw) as Record<string, unknown>
    } catch {
      settings = {}
    }
  } else if (settingsRaw != null && typeof settingsRaw === 'object') {
    settings = settingsRaw as Record<string, unknown>
  }

  const considerVideoAttendanceForActualAttendance =
    settings.considerVideoAttendanceForActualAttendance === true

  const enableVideoAttendance =
    settings.enableVideoAttendance === true ||
    considerVideoAttendanceForActualAttendance

  const catchUpDaysFromSettings = Number(settings.catchUpDays)
  const catchUpDays =
    Number.isFinite(catchUpDaysFromSettings) && catchUpDaysFromSettings > 0
      ? catchUpDaysFromSettings
      : 0

  const markAbsentIfLate = settings.markAbsentIfLate === true

  return {
    enableVideoAttendance,
    considerVideoAttendanceForActualAttendance,
    catchUpDays,
    markAbsentIfLate,
  }
}
