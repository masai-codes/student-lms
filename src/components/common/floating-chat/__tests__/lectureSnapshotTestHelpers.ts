import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LectureSupportSnapshot } from '@/server/api/support/support.types'
import { buildLectureAttendanceSummary } from '@/server/attendance/utils/buildLectureAttendanceSummary'
import type { StudentAttendanceRow } from '@/server/attendance/types'

const LECTURE_SCHEDULE = '2026-05-01 10:00:00'
const LECTURE_CONCLUDES = '2026-05-01 12:00:00'

/** Two days after conclude — catch-up window still open when catchUpDays = 5. */
export const NOW_WINDOW_OPEN = new Date('2026-05-03 12:00:00+05:30').getTime()

/** Nine days after conclude — catch-up window closed when catchUpDays = 5. */
export const NOW_WINDOW_CLOSED = new Date('2026-05-10 12:00:00+05:30').getTime()

export function absentRow(
  overrides: Partial<StudentAttendanceRow> = {},
): StudentAttendanceRow {
  return {
    lectureId: 1,
    status: 0,
    videoPercentage: 0,
    includeVideoAttendance: 1,
    catchUpDays: 5,
    lateByMinutes: null,
    liveAttendanceStatus: 0,
    videoAttendanceStatus: 0,
    meta: { notApplicable: false },
    ...overrides,
  }
}

/** Row + section combo where only live join counts — no catch-up window. */
export function liveOnlyAbsentRow(
  overrides: Partial<StudentAttendanceRow> = {},
): StudentAttendanceRow {
  return absentRow({
    includeVideoAttendance: 0,
    catchUpDays: 0,
    ...overrides,
  })
}

export function presentRow(): StudentAttendanceRow {
  return absentRow({
    status: 1,
    liveAttendanceStatus: 1,
    videoAttendanceStatus: 1,
  })
}

export function buildAttendanceFromSection(
  sectionSettings: Record<string, unknown>,
  record: StudentAttendanceRow | null,
  nowMs: number,
  watchPercentage = 0,
): LectureAttendanceSummary {
  return buildLectureAttendanceSummary(
    {
      lectureId: 1,
      sectionId: 2,
      schedule: LECTURE_SCHEDULE,
      concludes: LECTURE_CONCLUDES,
      sectionSettings,
    },
    record,
    nowMs,
    watchPercentage,
  )
}

export function makeSnapshotFromAttendance(
  attendance: LectureAttendanceSummary | null,
  overrides: Partial<LectureSupportSnapshot> = {},
): LectureSupportSnapshot {
  return {
    lectureId: 1,
    batchId: 42,
    title: 'Intro to JS',
    meta: 'Module 1',
    date: '1 May, 10:00 am',
    lectureDisplayType: 'live',
    lectureKind: 'live',
    schedule: LECTURE_SCHEDULE,
    isOptional: false,
    isMandatory: true,
    livePhase: 'after',
    videoPhase: null,
    joinLiveButtonState: null,
    isSessionPending: false,
    recordingStatus: 'available',
    recordingUrl: 'https://example.com/video',
    aiSummaryStatus: 'generated',
    attendance,
    showAttendance: true,
    ...overrides,
  }
}
