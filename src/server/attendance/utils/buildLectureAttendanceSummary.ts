import type {
  LectureAttendanceContext,
  LectureAttendanceSummary,
  StudentAttendanceRow,
} from '@/server/attendance/types'
import { computeCatchUpWindow } from '@/server/attendance/utils/computeCatchUpWindow'
import { parseSectionAttendanceSettings } from '@/server/attendance/utils/parseSectionAttendanceSettings'

function readNotApplicable(meta: unknown): boolean {
  if (meta == null || typeof meta !== 'object') return false
  return (meta as Record<string, unknown>).notApplicable === true
}

export function buildLectureAttendanceSummary(
  context: LectureAttendanceContext,
  record: StudentAttendanceRow | null,
  nowMs: number,
  /**
   * Live recording watch progress (0–100) from `video_attendances.duration`.
   * Defaults to 0 when the student has no watch row yet.
   */
  videoWatchPercentage = 0,
): LectureAttendanceSummary {
  const sectionSettings = parseSectionAttendanceSettings(
    context.sectionSettings,
  )
  const hasStudentAttendanceEntry = record != null

  const catchUpDaysFromRecord = Number(record?.catchUpDays)
  const catchUpDays =
    sectionSettings.catchUpDays > 0
      ? sectionSettings.catchUpDays
      : Number.isFinite(catchUpDaysFromRecord) && catchUpDaysFromRecord > 0
        ? catchUpDaysFromRecord
        : 0

  const includeVideoAttendance =
    Boolean(record?.includeVideoAttendance) ||
    sectionSettings.enableVideoAttendance

  const isAbsent = record != null ? record.status === 0 : true
  const { daysRemaining, isCatchupWindowOver } = computeCatchUpWindow({
    schedule: context.schedule,
    concludes: context.concludes,
    catchUpDays,
    includeVideoAttendance,
    isAbsent,
    nowMs,
  })

  const notApplicable = hasStudentAttendanceEntry
    ? readNotApplicable(record?.meta)
    : true

  return {
    overallStatus: record?.status ?? null,
    notApplicable,
    hasStudentAttendanceEntry,
    isCatchupWindowOver,
    videoPercentage: record?.videoPercentage ?? 0,
    watchPercentage: videoWatchPercentage,
    daysRemaining,
    lateByMinutes: record?.lateByMinutes ?? null,
    liveAttendanceStatus: record?.liveAttendanceStatus ?? 0,
    videoAttendanceStatus: record?.videoAttendanceStatus ?? 0,
    includeVideoAttendance,
    // Section-derived so the banner is reliable even when the per-student
    // `include_video_attendance` column is stale (see upgrade/backfill notes).
    videoCountsForAttendance:
      sectionSettings.considerVideoAttendanceForActualAttendance,
    markAbsentIfLate: sectionSettings.markAbsentIfLate,
  }
}
